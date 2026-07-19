import re

with open("app/api/webhooks/stripe/route.ts", "r") as f:
    content = f.read()

content = content.replace("prisma.payment.findUnique", "prisma.payment.findFirst")

with open("app/api/webhooks/stripe/route.ts", "w") as f:
    f.write(content)
