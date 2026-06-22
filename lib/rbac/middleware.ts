import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export function withPermission(
  requiredPermission: string,
  handler: NextApiHandler
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // @ts-ignore - Assuming we will extend NextAuth types
      const permissions: string[] = session.user.permissions || [];

      if (!permissions.includes(requiredPermission)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `Missing required permission: ${requiredPermission}`,
        });
      }

      return handler(req, res);
    } catch (error) {
      console.error("[RBAC Error]", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
