import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Replace reverse relations
content = content.replace('foodOrders            FoodOrder[]', 'internalOrders        InternalOrder[]')
content = content.replace('order       FoodOrder?            @relation(fields: [orderId], references: [id])', 'internalOrder InternalOrder?      @relation(fields: [orderId], references: [id])')
content = content.replace('orders   POSOrder[]', 'internalOrders InternalOrder[]')
content = content.replace('orderItems POSOrderItem[]', 'internalOrderItems InternalOrderItem[]')
content = content.replace('orderItems      OrderItem[]', 'internalOrderItems InternalOrderItem[]')
content = content.replace('foodOrders         FoodOrder[]         @relation("GuestOrders")', 'internalOrders     InternalOrder[]         @relation("GuestInternalOrders")')

# Replace FoodOrder model
content = re.sub(r'model FoodOrder \{.*?\n\}', '', content, flags=re.DOTALL)
# Replace OrderItem model
content = re.sub(r'model OrderItem \{.*?\n\}', '', content, flags=re.DOTALL)
# Replace POSOrder model
content = re.sub(r'model POSOrder \{.*?\n\}', '', content, flags=re.DOTALL)
# Replace POSOrderItem model
content = re.sub(r'model POSOrderItem \{.*?\n\}', '', content, flags=re.DOTALL)

# Add InternalOrder and InternalOrderItem
internal_order_models = """
model InternalOrder {
  id              String    @id @default(uuid())
  orderType       String    @default("IN_ROOM_DINING") // "POS_OUTLET", "IN_ROOM_DINING", "SPA"
  status          String    // PENDING, PREPARING, DELIVERED, COMPLETED, CANCELLED
  totalAmount     Float
  
  // Relations
  guestId         String?
  roomId          String?
  outletId        String?
  folioId         String?
  
  // Specific to order types
  paymentType     String?   // CASH, CARD, ROOM_CHARGE
  specialRequests String?
  deliveryTime    DateTime?
  idempotencyKey  String?   @unique
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  items    InternalOrderItem[]
  payments Payment[]
  
  guest    User?       @relation("GuestInternalOrders", fields: [guestId], references: [id])
  room     Room?       @relation(fields: [roomId], references: [id])
  outlet   POSOutlet?  @relation(fields: [outletId], references: [id])
  folio    Folio?      @relation(fields: [folioId], references: [id])

  @@index([guestId])
}

model InternalOrderItem {
  id         String   @id @default(uuid())
  orderId    String
  productId  String?  // References POSProduct
  menuItemId String?  // String reference for legacy/food orders
  quantity   Int
  price      Float
  subtotal   Float
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  order      InternalOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product    POSProduct?   @relation(fields: [productId], references: [id])
  menuItem   FoodMenu?     @relation(fields: [menuItemId], references: [id])
}
"""

content += internal_order_models

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

