import os

files = [
    "app/api/admin/analytics/bi/route.ts",
    "app/api/room-reviews/route.ts",
    "app/api/room-reviews/[id]/route.ts",
    "app/api/hotel-reviews/route.ts",
    "app/api/hotel-reviews/[id]/route.ts"
]

for file_path in files:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r") as f:
        content = f.read()

    # Generic replaces
    content = content.replace("prisma.roomReview", "prisma.feedback")
    content = content.replace("prisma.hotelReview", "prisma.feedback")
    content = content.replace("RoomReview", "Feedback")
    content = content.replace("HotelReview", "Feedback")

    with open(file_path, "w") as f:
        f.write(content)
