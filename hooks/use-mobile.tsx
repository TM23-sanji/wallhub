import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create the media query matcher
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Define the handler function
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    
    // Initial check
    setIsMobile(mql.matches)
    
    // Modern event listener approach (compatible with React 19)
    mql.addEventListener("change", handleChange)
    
    // Cleanup
    return () => {
      mql.removeEventListener("change", handleChange)
    }
  }, [])

  return !!isMobile
}