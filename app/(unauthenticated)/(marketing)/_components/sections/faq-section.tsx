"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { useState } from "react"
import { SectionWrapper } from "./section-wrapper"

const faqs = [
  {
    question: "What is HyperHealth?",
    answer:
      "HyperHealth is a distributed Electronic Health Record (EHR) system that uses Git's version control technology to manage patient health data. Unlike traditional centralized EHR systems, HyperHealth allows patients to own and control their complete medical history while enabling secure sharing with healthcare providers."
  },
  {
    question: "How does the AI extraction work?",
    answer:
      "HyperHealth uses Google Gemini AI to automatically extract structured medical data from various sources including medical documents, lab results, clinical notes, and medical images. The AI identifies and categorizes medical information with confidence scores, making it easy to digitize paper records."
  },
  {
    question: "Is my health data secure?",
    answer:
      "Yes! HyperHealth uses end-to-end encryption and follows healthcare security standards. Your data is distributed across Git repositories with full access control - you decide who can view or modify your records. No single entity controls your complete medical history."
  },
  {
    question: "How is this different from traditional EHR systems?",
    answer:
      "Traditional EHR systems are centralized and controlled by healthcare institutions. HyperHealth is patient-controlled and distributed - your health records follow you, not the other way around. You can grant access to any healthcare provider while maintaining complete ownership of your data."
  },
  {
    question: "What is OpenEHR compatibility?",
    answer:
      "OpenEHR is an international standard for electronic health records that ensures interoperability between different healthcare systems. HyperHealth uses OpenEHR archetypes to structure health data, making it compatible with existing healthcare infrastructure worldwide."
  },
  {
    question: "Can healthcare providers integrate with HyperHealth?",
    answer:
      "Yes! Healthcare providers can integrate with HyperHealth through our API to access patient records (with permission), contribute new data, and maintain their own distributed copies. This creates a network effect where health data becomes more valuable as more providers participate."
  }
]

export function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (question: string) => {
    setOpenItems(prev =>
      prev.includes(question)
        ? prev.filter(item => item !== question)
        : [...prev, question]
    )
  }

  return (
    <SectionWrapper id="faq">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="text-foreground text-2xl leading-10 font-bold tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            className="text-muted-foreground mt-6 text-base leading-7"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Everything you need to know about HyperHealth. Can't find what
            you're looking for? Contact us or open an issue on GitHub.
          </motion.p>
          <dl className="mt-10 space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Collapsible
                  open={openItems.includes(faq.question)}
                  onOpenChange={() => toggleItem(faq.question)}
                >
                  <CollapsibleTrigger className="flex w-full items-start justify-between text-left">
                    <span className="text-foreground text-base leading-7 font-semibold">
                      {faq.question}
                    </span>
                    <motion.span
                      className="ml-6 flex h-7 items-center"
                      animate={{
                        rotate: openItems.includes(faq.question) ? 45 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus
                        className="text-muted-foreground h-6 w-6"
                        aria-hidden="true"
                      />
                    </motion.span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 pr-12">
                    <motion.p
                      className="text-muted-foreground text-base leading-7"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {faq.answer}
                    </motion.p>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </SectionWrapper>
  )
}
