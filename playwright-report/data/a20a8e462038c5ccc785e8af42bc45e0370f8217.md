# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]:
      - img [ref=e8]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: "0"
          - generic [ref=e15]: "1"
        - generic [ref=e16]: Issue
      - button "Collapse issues badge" [ref=e17]:
        - img [ref=e18]
  - alert [ref=e20]
  - generic [ref=e22]:
    - img [ref=e24]
    - generic [ref=e26]:
      - heading "Something went wrong" [level=3] [ref=e27]
      - paragraph [ref=e28]: We encountered an error while loading the page.
      - group [ref=e29]:
        - generic "Error Details" [ref=e30] [cursor=pointer]
      - button "Try again" [ref=e32] [cursor=pointer]
```