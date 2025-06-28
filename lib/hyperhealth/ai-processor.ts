/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ExtractedMedicalData {
  type: 'lab_result' | 'diagnosis' | 'medication' | 'vital_signs' | 'clinical_note'
  category: string
  data: {
    name: string
    value: string
    units?: string
    date?: string
    status?: string
    reference_range?: string
    interpretation?: string
    notes?: string
  }
  confidence: number
  source_text: string
}

export class AIProcessor {
  private genAI: GoogleGenerativeAI
  private model: any
  private extractionPrompt: string

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      }
    })
    
    this.extractionPrompt = `
You are a medical data extraction AI specialized in creating OpenEHR-compliant records. Analyze the provided content and extract structured medical information.

IMPORTANT: You must extract these specific types of medical data and format them according to OpenEHR standards:

1. **LAB_RESULT** - Blood tests, urine tests, imaging results, pathology reports
2. **DIAGNOSIS** - Medical conditions, diseases, symptoms, clinical assessments  
3. **MEDICATION** - Prescriptions, dosages, drug names, administration instructions
4. **VITAL_SIGNS** - Blood pressure, heart rate, temperature, weight, height, oxygen saturation
5. **CLINICAL_NOTE** - Doctor observations, patient history, treatment plans

For each medical data point found, return this EXACT JSON structure:
{
  "type": "lab_result|diagnosis|medication|vital_signs|clinical_note",
  "category": "specific medical category (e.g., 'blood_chemistry', 'cardiovascular', 'prescription')",
  "data": {
    "name": "specific medical term or test name",
    "value": "measured value, description, or finding",
    "units": "measurement units if applicable (e.g., 'mg/dL', 'mmHg', 'bpm')",
    "date": "date in ISO format YYYY-MM-DD if mentioned",
    "status": "status if applicable (e.g., 'active', 'resolved', 'prescribed')",
    "reference_range": "normal range if provided (e.g., '70-100 mg/dL')",
    "interpretation": "clinical interpretation if stated (e.g., 'high', 'low', 'normal')",
    "notes": "additional clinical context or instructions"
  },
  "confidence": 0.0-1.0,
  "source_text": "exact text excerpt that contains this medical information"
}

EXTRACTION RULES:
- Only extract genuine medical information
- Assign high confidence (0.8+) to clear medical data with units/values
- Assign medium confidence (0.6-0.8) to clinical observations without precise values
- Assign low confidence (0.4-0.6) to implied or uncertain medical information
- Include specific values, units, and ranges when available
- Map common medical abbreviations (BP = blood pressure, HR = heart rate, etc.)
- For medications, include dosage, frequency, and route if mentioned
- For lab results, include reference ranges and interpretations when available

Return ONLY a valid JSON array of extracted records. If no medical data is found, return an empty array [].

Examples of what to extract:
- "BP 140/90 mmHg" → vital_signs with systolic/diastolic values
- "Hemoglobin 12.5 g/dL (normal 12-16)" → lab_result with value and reference range
- "Diagnosed with Type 2 diabetes" → diagnosis with condition name
- "Prescribed metformin 500mg twice daily" → medication with dosage and frequency
- "Patient reports chest pain" → clinical_note with symptom description
    `
  }
  
  async processFile(fileBuffer: Buffer, mimeType: string, filename: string): Promise<ExtractedMedicalData[]> {
    try {
      console.log(`🤖 AI processing file: ${filename} (${mimeType})`)
      
      let content: any[]
      
      if (mimeType.startsWith('image/')) {
        content = [
          "Extract medical information from this medical image (lab results, prescriptions, medical reports, etc.):",
          {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: mimeType
            }
          }
        ]
      } else if (mimeType.startsWith('video/')) {
        content = [
          "Extract medical information from this medical video (patient consultations, procedure recordings, medical presentations, etc.):",
          {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: mimeType
            }
          }
        ]
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`)
      }
      
      const result = await this.model.generateContent([this.extractionPrompt, ...content])
      const response = result.response.text()
      
      console.log(`📄 AI response length: ${response.length} characters`)
      
      return this.parseAIResponse(response)
      
    } catch (error: any) {
      if (error.message?.includes('API_KEY')) {
        throw new Error('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.')
      }
      
      throw new Error(`AI processing failed: ${error.message}`)
    }
  }
  
  async processText(text: string): Promise<ExtractedMedicalData[]> {
    try {
      console.log(`🤖 AI processing text input (${text.length} characters)`)
      
      const result = await this.model.generateContent([
        this.extractionPrompt,
        `\n\nMedical text to analyze:\n${text}`
      ])
      
      const response = result.response.text()
      console.log(`📄 AI response length: ${response.length} characters`)
      
      return this.parseAIResponse(response)
      
    } catch (error: any) {
      if (error.message?.includes('API_KEY')) {
        throw new Error('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.')
      }
      
      throw new Error(`AI text processing failed: ${error.message}`)
    }
  }
  
  private parseAIResponse(response: string): ExtractedMedicalData[] {
    try {
      // Clean the response - remove any markdown formatting
      let cleanedResponse = response.trim()
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // Try direct JSON parse first
      const parsed = JSON.parse(cleanedResponse)
      
      // Validate the structure
      if (!Array.isArray(parsed)) {
        console.warn('AI response is not an array, wrapping in array')
        return [parsed]
      }
      
      // Validate each record has required fields
      const validRecords = parsed.filter(record => {
        return record && 
               typeof record === 'object' && 
               record.type && 
               record.data && 
               typeof record.confidence === 'number'
      })
      
      console.log(`✅ Parsed ${validRecords.length} valid medical records from AI response`)
      
      // Add default values for missing fields
      return validRecords.map(record => ({
        type: record.type,
        category: record.category || 'general',
        data: {
          name: record.data.name || 'Unknown',
          value: record.data.value || '',
          units: record.data.units || '',
          date: record.data.date || new Date().toISOString().split('T')[0],
          status: record.data.status || '',
          reference_range: record.data.reference_range || '',
          interpretation: record.data.interpretation || '',
          notes: record.data.notes || ''
        },
        confidence: Math.max(0, Math.min(1, record.confidence || 0.5)),
        source_text: record.source_text || ''
      }))
      
    } catch (parseError: any) {
      console.log('Raw AI response:', response)
      console.error('JSON parse error:', parseError.message)
      
      // Try to extract JSON array from response using regex
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          console.log('✅ Successfully extracted JSON from AI response using regex')
          return this.parseAIResponse(jsonMatch[0]) // Recursive call with cleaned JSON
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', secondParseError)
        }
      }
      
      // Try to extract individual JSON objects
      const objectMatches = response.match(/\{[^{}]*"type"[^{}]*\}/g)
      if (objectMatches && objectMatches.length > 0) {
        const records = []
        for (const match of objectMatches) {
          try {
            const record = JSON.parse(match)
            records.push(record)
          } catch (e) {
            console.warn('Failed to parse individual record:', match)
          }
        }
        if (records.length > 0) {
          console.log(`✅ Extracted ${records.length} records using object matching`)
          return this.parseAIResponse(JSON.stringify(records)) // Recursive call
        }
      }
      
      // If all parsing fails, return empty array
      console.warn('Could not parse AI response, returning empty array')
      return []
    }
  }
}