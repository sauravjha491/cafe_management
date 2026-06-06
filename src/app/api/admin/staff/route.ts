import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, password } = body;

    let firebaseUid = `temp_${Date.now()}`;

    // 1. Attempt Firebase Auth if configured
    if (isFirebaseAdminConfigured && adminAuth) {
      try {
        const firebaseUser = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });
        firebaseUid = firebaseUser.uid;
      } catch (authError: any) {
        console.error("Firebase Auth Error:", authError);
        return NextResponse.json({ 
          error: "Auth Error", 
          details: authError.code === "auth/email-already-exists" 
            ? "This email is already registered in Firebase" 
            : authError.message 
        }, { status: 400 });
      }
    } else {
      console.warn("⚠️ Firebase Admin not configured. Creating local-only user.");
    }

    // 2. Create user in Prisma database
    const user = await prisma.user.create({
      data: {
        id: firebaseUid,
        name,
        email,
        role: role || "STAFF",
      },
    });

    return NextResponse.json({
      ...user,
      _warning: !isFirebaseAdminConfigured ? "Firebase Auth was skipped due to missing configuration." : undefined
    });
  } catch (error: any) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to create staff", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");
    
    if (!id && !email) return NextResponse.json({ error: "ID or Email required" }, { status: 400 });

    const body = await req.json();
    const { password, ...otherData } = body;

    // 1. Update Firebase Auth if configured
    if (isFirebaseAdminConfigured && adminAuth) {
      const updateData: any = {};
      if (otherData.name) updateData.displayName = otherData.name;
      if (password) updateData.password = password;
      if (otherData.email) updateData.email = otherData.email;

      if (Object.keys(updateData).length > 0) {
        const targetId = id || (await prisma.user.findUnique({ where: { email: email as string } }))?.id;
        if (targetId && !targetId.startsWith("temp_")) {
          await adminAuth.updateUser(targetId, updateData);
        }
      }
    }

    // 2. Update Prisma
    const user = await prisma.user.update({
      where: id ? { id } : { email: email as string },
      data: otherData,
    });
    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update staff", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // 1. Delete from Firebase Auth if configured
    if (isFirebaseAdminConfigured && adminAuth && id && !id.startsWith("temp_")) {
      try {
        await adminAuth.deleteUser(id);
      } catch (authError) {
        console.error("Firebase Auth Delete Error (non-fatal):", authError);
      }
    }

    // 2. Delete from Prisma
    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete staff", details: error.message }, { status: 500 });
  }
}
