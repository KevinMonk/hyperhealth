import { Github, Instagram, Music2, Youtube } from "lucide-react"
import Link from "next/link"

const XLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export function Footer() {
  const footerNavigation = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Health Records", href: "/health-records" },
      { name: "Medical Capture", href: "/medical-capture" },
      { name: "FAQ", href: "#faq" }
    ],
    healthcare: [
      { name: "OpenEHR Standard", href: "https://openehr.org" },
      { name: "FHIR Compatibility", href: "https://hl7.org/fhir" },
      { name: "Healthcare Providers", href: "#" },
      { name: "Patient Rights", href: "#" }
    ],
    developers: [
      { name: "GitHub Repository", href: "https://github.com/KevinMonk/hyperhealth" },
      { name: "API Documentation", href: "#" },
      { name: "Contributing", href: "#" },
      { name: "Issues", href: "https://github.com/KevinMonk/hyperhealth/issues" }
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "HIPAA Compliance", href: "#" },
      { name: "Open Source License", href: "#" }
    ]
  }

  const socialLinks = [
    { name: "GitHub", href: "https://github.com/KevinMonk/hyperhealth", icon: Github }
  ]

  return (
    <footer className="bg-muted/50" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/" className="text-xl font-bold">
              Company
            </Link>
            <p className="text-muted-foreground text-sm leading-6">
              Your company description here.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-foreground text-sm leading-6 font-semibold">
                  Product
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.product.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground text-sm leading-6"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-foreground text-sm leading-6 font-semibold">
                  Healthcare
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.healthcare.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground text-sm leading-6"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-foreground text-sm leading-6 font-semibold">
                  Developers
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.developers.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground text-sm leading-6"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-foreground text-sm leading-6 font-semibold">
                  Legal
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.legal.map(item => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground text-sm leading-6"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="border-border mt-16 border-t pt-8 sm:mt-20 lg:mt-24">
          <p className="text-muted-foreground text-xs leading-5">
            &copy; {new Date().getFullYear()} Company, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
