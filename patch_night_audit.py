import re

with open("app/api/admin/accounting/night-audit/route.ts", "r") as f:
    content = f.read()

# Replace tx.invoice with tx.folio
content = content.replace("tx.invoice", "tx.folio")
content = content.replace("tx.invoiceLineItem", "tx.folioLineItem")

# Replace invoiceId with folioId
content = content.replace("invoiceId:", "folioId:")

# Fix Folio creation to remove invoiceNo, subtotal, taxAmount, grandTotal and add propertyId
old_folio_create = """          folio = await tx.folio.create({
            data: {
              bookingId: booking.id,
              invoiceNo: `FOL-${Date.now()}-${booking.id.slice(0,4)}`,
              folioType: 'MASTER',
              status: 'OPEN',
              subtotal: 0, taxAmount: 0, grandTotal: 0
            }
          });"""
new_folio_create = """          folio = await tx.folio.create({
            data: {
              bookingId: booking.id,
              type: 'MASTER',
              status: 'OPEN',
              propertyId: booking.propertyId
            }
          });"""
content = content.replace("folioType: 'MASTER'", "type: 'MASTER'")
content = content.replace(old_folio_create, new_folio_create)

# Fix FolioLineItem creation (amount, category) instead of quantity, unitPrice, totalPrice
old_line_item = """        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: `Room Charge - ${assignment?.room?.number || 'TBD'}`,
            category: 'ROOM',
            quantity: 1,
            unitPrice: rate,
            totalPrice: rate + tax
          }
        });"""
new_line_item = """        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: `Room Charge - ${assignment?.room?.number || 'TBD'}`,
            category: 'ROOM_CHARGE',
            amount: rate + tax
          }
        });"""
content = content.replace(old_line_item, new_line_item)

# Remove the tx.folio.update that updates subtotal, taxAmount, grandTotal
update_block = re.search(r"        await tx\.folio\.update\(\{\n          where: \{ id: folio\.id \},\n          data: \{\n            subtotal: folio\.subtotal \+ rate,\n            taxAmount: folio\.taxAmount \+ tax,\n            grandTotal: folio\.grandTotal \+ rate \+ tax\n          \}\n        \}\);\n", content)
if update_block:
    content = content.replace(update_block.group(0), "")

with open("app/api/admin/accounting/night-audit/route.ts", "w") as f:
    f.write(content)
