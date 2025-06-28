/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from 'uuid'

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

interface MappedRecord {
  type: string
  category: string
  confidence: number
  openEHR: Record<string, unknown>
  extractedData: Record<string, unknown>
  sourceText: string
  mappingError?: string
}

export class DataMapper {
  private templates: Record<string, any> = {}

  constructor() {
    // In Next.js, we'll use inline templates instead of file loading
    this.initializeTemplates()
  }

  private initializeTemplates() {
    // Initialize with basic OpenEHR templates
    console.log('✅ Initialized OpenEHR templates')
  }

  async mapToOpenEHR(extractedRecords: ExtractedMedicalData[]): Promise<MappedRecord[]> {
    const mapped: MappedRecord[] = []
    
    console.log(`🔄 Mapping ${extractedRecords.length} extracted records to OpenEHR format`)
    
    for (const record of extractedRecords) {
      try {
        let openEHRRecord: Record<string, unknown>
        
        switch (record.type) {
          case 'lab_result':
            openEHRRecord = await this.createLabResult(record)
            break
          case 'diagnosis':
            openEHRRecord = await this.createDiagnosis(record)
            break
          case 'medication':
            openEHRRecord = await this.createMedication(record)
            break
          case 'vital_signs':
            openEHRRecord = await this.createVitalSigns(record)
            break
          case 'clinical_note':
            openEHRRecord = await this.createClinicalNote(record)
            break
          default:
            console.warn(`Unknown record type: ${record.type}, creating generic record`)
            openEHRRecord = await this.createGenericRecord(record)
        }
        
        mapped.push({
          type: record.type,
          category: record.category,
          confidence: record.confidence,
          openEHR: openEHRRecord,
          extractedData: record.data,
          sourceText: record.source_text
        })
        
        console.log(`✅ Mapped ${record.type} record: ${record.category}`)
        
      } catch (error: unknown) {
        console.error(`❌ Mapping error for ${record.type}:`, error instanceof Error ? error.message : String(error))
        // Create a fallback record so we don't lose data
        try {
          const fallbackRecord = await this.createGenericRecord(record)
          mapped.push({
            type: record.type,
            category: record.category,
            confidence: record.confidence * 0.8, // Reduce confidence for fallback
            openEHR: fallbackRecord,
            extractedData: record.data,
            sourceText: record.source_text,
            mappingError: error instanceof Error ? error.message : String(error)
          })
          console.log(`⚠️ Created fallback record for ${record.type}`)
        } catch (fallbackError: unknown) {
          console.error(`❌ Fallback creation failed for ${record.type}:`, fallbackError instanceof Error ? fallbackError.message : String(fallbackError))
        }
      }
    }
    
    console.log(`📋 Successfully mapped ${mapped.length}/${extractedRecords.length} records to OpenEHR`)
    return mapped
  }

  private async createLabResult(record: ExtractedMedicalData): Promise<Record<string, unknown>> {
    return {
      "_type": "COMPOSITION",
      "archetype_node_id": "openEHR-EHR-COMPOSITION.report.v1",
      "name": { "value": "Laboratory Test Report" },
      "uid": `${uuidv4()}::hyperhealth::1`,
      "context": {
        "_type": "EVENT_CONTEXT",
        "start_time": {
          "_type": "DV_DATE_TIME",
          "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
        }
      },
      "content": [{
        "_type": "OBSERVATION",
        "archetype_node_id": "openEHR-EHR-OBSERVATION.lab_test_result.v1",
        "name": { "value": record.data.name || 'Laboratory Test' },
        "data": {
          "_type": "HISTORY",
          "archetype_node_id": "at0001",
          "events": [{
            "_type": "POINT_EVENT",
            "archetype_node_id": "at0002",
            "time": {
              "_type": "DV_DATE_TIME",
              "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
            },
            "data": {
              "_type": "ITEM_TREE",
              "archetype_node_id": "at0003",
              "items": [{
                "_type": "CLUSTER",
                "archetype_node_id": "at0005",
                "name": { "value": record.data.name || 'Test Result' },
                "items": [
                  {
                    "_type": "ELEMENT",
                    "archetype_node_id": "at0001",
                    "name": { "value": "Value" },
                    "value": this.createValueElement(record.data.value, record.data.units)
                  },
                  ...(record.data.reference_range ? [{
                    "_type": "ELEMENT",
                    "archetype_node_id": "at0004",
                    "name": { "value": "Reference range" },
                    "value": { "_type": "DV_TEXT", "value": record.data.reference_range }
                  }] : []),
                  ...(record.data.interpretation ? [{
                    "_type": "ELEMENT",
                    "archetype_node_id": "at0030",
                    "name": { "value": "Interpretation" },
                    "value": { "_type": "DV_TEXT", "value": record.data.interpretation }
                  }] : [])
                ]
              }]
            }
          }]
        },
        ...(record.data.notes ? {
          "protocol": {
            "_type": "ITEM_TREE",
            "archetype_node_id": "at0004",
            "items": [{
              "_type": "ELEMENT",
              "archetype_node_id": "at0075",
              "name": { "value": "Overall comment" },
              "value": { "_type": "DV_TEXT", "value": record.data.notes }
            }]
          }
        } : {})
      }]
    }
  }

  private async createDiagnosis(record: ExtractedMedicalData): Promise<Record<string, unknown>> {
    return {
      "_type": "COMPOSITION",
      "archetype_node_id": "openEHR-EHR-COMPOSITION.problem_list.v1",
      "name": { "value": "Problem List" },
      "uid": `${uuidv4()}::hyperhealth::1`,
      "context": {
        "_type": "EVENT_CONTEXT",
        "start_time": {
          "_type": "DV_DATE_TIME",
          "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
        }
      },
      "content": [{
        "_type": "EVALUATION",
        "archetype_node_id": "openEHR-EHR-EVALUATION.problem_diagnosis.v1",
        "name": { "value": "Problem/Diagnosis" },
        "data": {
          "_type": "ITEM_TREE",
          "archetype_node_id": "at0001",
          "items": [
            {
              "_type": "ELEMENT",
              "archetype_node_id": "at0002",
              "name": { "value": "Problem/Diagnosis name" },
              "value": { "_type": "DV_TEXT", "value": record.data.name || 'Unknown diagnosis' }
            },
            ...(record.data.date ? [{
              "_type": "ELEMENT",
              "archetype_node_id": "at0005",
              "name": { "value": "Date of onset" },
              "value": { "_type": "DV_DATE", "value": record.data.date }
            }] : []),
            ...(record.data.status ? [{
              "_type": "ELEMENT",
              "archetype_node_id": "at0077",
              "name": { "value": "Clinical status" },
              "value": {
                "_type": "DV_CODED_TEXT",
                "value": this.mapDiagnosisStatus(record.data.status).value,
                "defining_code": {
                  "code_string": this.mapDiagnosisStatus(record.data.status).code,
                  "terminology_id": { "value": "SNOMED-CT" }
                }
              }
            }] : [])
          ]
        }
      }]
    }
  }

  private async createMedication(record: ExtractedMedicalData): Promise<Record<string, unknown>> {
    return {
      "_type": "COMPOSITION",
      "archetype_node_id": "openEHR-EHR-COMPOSITION.medication_list.v1",
      "name": { "value": "Medication List" },
      "uid": `${uuidv4()}::hyperhealth::1`,
      "context": {
        "_type": "EVENT_CONTEXT",
        "start_time": {
          "_type": "DV_DATE_TIME",
          "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
        }
      },
      "content": [{
        "_type": "INSTRUCTION",
        "archetype_node_id": "openEHR-EHR-INSTRUCTION.medication_order.v2",
        "name": { "value": "Medication order" },
        "narrative": { "value": `${record.data.name} - ${record.data.value}` },
        "activities": [{
          "_type": "ACTIVITY",
          "archetype_node_id": "at0001",
          "description": {
            "_type": "ITEM_TREE",
            "archetype_node_id": "at0002",
            "items": [
              {
                "_type": "ELEMENT",
                "archetype_node_id": "openEHR-EHR-CLUSTER.medication.v1.at0001",
                "name": { "value": "Medication" },
                "value": { "_type": "DV_TEXT", "value": record.data.name || 'Unknown medication' }
              },
              ...(record.data.value ? [{
                "_type": "ELEMENT",
                "archetype_node_id": "at0011",
                "name": { "value": "Dosage" },
                "value": { "_type": "DV_TEXT", "value": record.data.value }
              }] : []),
              ...(record.data.notes ? [{
                "_type": "ELEMENT",
                "archetype_node_id": "at0013",
                "name": { "value": "Administration instructions" },
                "value": { "_type": "DV_TEXT", "value": record.data.notes }
              }] : [])
            ]
          }
        }]
      }]
    }
  }

  private async createVitalSigns(record: ExtractedMedicalData): Promise<Record<string, unknown>> {
    return {
      "_type": "COMPOSITION",
      "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
      "name": { "value": "Vital Signs" },
      "uid": `${uuidv4()}::hyperhealth::1`,
      "context": {
        "_type": "EVENT_CONTEXT",
        "start_time": {
          "_type": "DV_DATE_TIME",
          "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
        }
      },
      "content": [{
        "_type": "OBSERVATION",
        "archetype_node_id": "openEHR-EHR-OBSERVATION.vital_signs.v1",
        "name": { "value": record.data.name || "Vital Signs" },
        "data": {
          "_type": "HISTORY",
          "archetype_node_id": "at0001",
          "events": [{
            "_type": "POINT_EVENT",
            "archetype_node_id": "at0002",
            "time": {
              "_type": "DV_DATE_TIME",
              "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
            },
            "data": {
              "_type": "ITEM_TREE",
              "archetype_node_id": "at0003",
              "items": [{
                "_type": "ELEMENT",
                "archetype_node_id": "at0004",
                "name": { "value": record.data.name || "Measurement" },
                "value": this.createValueElement(record.data.value, record.data.units)
              }]
            }
          }]
        }
      }]
    }
  }

  private async createClinicalNote(record: ExtractedMedicalData): Promise<Record<string, unknown>> {
    return {
      "_type": "COMPOSITION",
      "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
      "name": { "value": "Clinical Note" },
      "uid": `${uuidv4()}::hyperhealth::1`,
      "context": {
        "_type": "EVENT_CONTEXT",
        "start_time": {
          "_type": "DV_DATE_TIME",
          "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
        }
      },
      "content": [{
        "_type": "EVALUATION",
        "archetype_node_id": "openEHR-EHR-EVALUATION.clinical_synopsis.v1",
        "name": { "value": record.data.name || "Clinical Note" },
        "data": {
          "_type": "ITEM_TREE",
          "archetype_node_id": "at0001",
          "items": [{
            "_type": "ELEMENT",
            "archetype_node_id": "at0002",
            "name": { "value": "Synopsis" },
            "value": {
              "_type": "DV_TEXT",
              "value": record.data.value || record.data.notes || "Clinical observation"
            }
          }]
        }
      }]
    }
  }

  private async createGenericRecord(record: ExtractedMedicalData): Promise<Record<string, unknown>> {
    return {
      "_type": "COMPOSITION",
      "archetype_node_id": "openEHR-EHR-COMPOSITION.encounter.v1",
      "name": { "value": "Medical Record" },
      "uid": `${uuidv4()}::hyperhealth::1`,
      "context": {
        "_type": "EVENT_CONTEXT",
        "start_time": {
          "_type": "DV_DATE_TIME",
          "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
        }
      },
      "content": [{
        "_type": "OBSERVATION",
        "archetype_node_id": "openEHR-EHR-OBSERVATION.story.v1",
        "name": { "value": record.category || "Medical Information" },
        "data": {
          "_type": "HISTORY",
          "archetype_node_id": "at0001",
          "events": [{
            "_type": "POINT_EVENT",
            "archetype_node_id": "at0002",
            "time": {
              "_type": "DV_DATE_TIME",
              "value": record.data.date ? new Date(record.data.date).toISOString() : new Date().toISOString()
            },
            "data": {
              "_type": "ITEM_TREE",
              "archetype_node_id": "at0003",
              "items": [{
                "_type": "ELEMENT",
                "archetype_node_id": "at0004",
                "name": { "value": record.data.name || "Information" },
                "value": {
                  "_type": "DV_TEXT",
                  "value": record.data.value || record.data.notes || "Medical information extracted"
                }
              }]
            }
          }]
        }
      }]
    }
  }

  private parseNumericValue(value: string): number | null {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  private createValueElement(value: string, units?: string): Record<string, unknown> {
    const numericValue = this.parseNumericValue(value)
    
    if (numericValue !== null && units) {
      return {
        "_type": "DV_QUANTITY",
        "magnitude": numericValue,
        "units": units
      }
    } else if (numericValue !== null) {
      return {
        "_type": "DV_COUNT",
        "magnitude": Math.round(numericValue)
      }
    } else {
      return {
        "_type": "DV_TEXT",
        "value": value || "No value"
      }
    }
  }

  private mapDiagnosisStatus(status: string): { value: string; code: string } {
    const statusMapping: Record<string, { value: string; code: string }> = {
      'active': { value: 'Active', code: '55561003' },
      'resolved': { value: 'Resolved', code: '413322009' },
      'inactive': { value: 'Inactive', code: '73425007' }
    }
    
    return statusMapping[status.toLowerCase()] || { value: status, code: 'local' }
  }
}