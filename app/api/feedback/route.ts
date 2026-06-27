import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const roomId = searchParams.get('roomId');

    const feedback = await prisma.feedback.findMany({
      where: {
        ...(targetType && { targetType }),
        ...(roomId && { roomId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, image: true } },
        ...(targetType === 'ROOM' && { room: { select: { roomNumber: true } } }),
      }
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { targetType, rating, overallRating, comment, roomId, serviceRating, cleanlinessRating, valueRating, title } = data;

    if (!targetType) {
        return NextResponse.json({ error: "targetType is required" }, { status: 400 });
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        targetType,
        rating: rating || overallRating || 5,
        overallRating: overallRating || rating || 5,
        comment,
        roomId: targetType === 'ROOM' ? roomId : undefined,
        serviceRating,
        cleanlinessRating,
        valueRating,
        title,
        verified: true, // Assuming logged in users are verified for this scope
      },
      include: {
        user: { select: { name: true, image: true } }
      }
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
