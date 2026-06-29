import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Replace reverse relations
content = content.replace('reviews               RoomReview[]', 'feedback              Feedback[]')
content = content.replace('reviews            RoomReview[]', 'feedback           Feedback[]')
content = content.replace('hotelReviews       HotelReview[]', 'feedback           Feedback[]')

# Delete old models
content = re.sub(r'model RoomReview \{.*?\n\}', '', content, flags=re.DOTALL)
content = re.sub(r'model HotelReview \{.*?\n\}', '', content, flags=re.DOTALL)

# Add new model
new_model = """
model Feedback {
  id                String   @id @default(uuid())
  userId            String
  targetType        String   @default("HOTEL") // "HOTEL", "ROOM", "RESTAURANT"
  
  rating            Int      @default(5)
  overallRating     Int      @default(5)
  serviceRating     Int?
  cleanlinessRating Int?
  valueRating       Int?
  
  title             String?
  comment           String?
  verified          Boolean  @default(false)
  createdAt         DateTime @default(now())

  roomId            String?
  bookingId         String?

  user              User     @relation(fields: [userId], references: [id])
  room              Room?    @relation(fields: [roomId], references: [id])
}
"""
content += new_model

# Deduplicate feedback field in User (since it replaced both reviews and hotelReviews)
content = content.replace('feedback           Feedback[]\n  feedback           Feedback[]', 'feedback           Feedback[]')
content = content.replace('feedback           Feedback[]\n  feedback       Feedback[]', 'feedback           Feedback[]')

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)
