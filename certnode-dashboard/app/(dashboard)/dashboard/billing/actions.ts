"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EnterpriseTier } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePlanTier } from "@/lib/billing";
import { getDashboardOverview } from "@/lib/dashboard";
import {
  getTierMetaByPlanStrict,
  comparePlanTiers,
  canMatchTier,
} from "@/lib/billing-dashboard";

export type PlanChangeState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const planSchema = z.object({
  targetTier: z.nativeEnum(EnterpriseTier),
});

export async function changePlanAction(
  _prev: PlanChangeState,
  formData: FormData,
): Promise<PlanChangeState> {
  const session = await auth();

  if (!session?.user?.enterpriseId) {
    return {
      status: "error",
      message: "Enterprise workspace required to manage billing.",
    };
  }

  const result = planSchema.safeParse({
    targetTier: formData.get("targetTier"),
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Invalid plan selected.",
    };
  }

  const enterpriseId = session.user.enterpriseId;
  const targetTier = result.data.targetTier;
  const targetNormalized = normalizePlanTier(targetTier);

  const [enterprise, overview] = await Promise.all([
    prisma.enterprise.findUnique({
      where: { id: enterpriseId },
      select: { billingTier: true },
    }),
    getDashboardOverview(enterpriseId),
  ]);

  if (!enterprise) {
    return {
      status: "error",
      message: "Enterprise not found.",
    };
  }

  const currentNormalized = normalizePlanTier(enterprise.billingTier);
  const comparison = comparePlanTiers(targetNormalized, currentNormalized);

  if (comparison === 0) {
    const targetMeta = getTierMetaByPlanStrict(targetNormalized);
    return {
      status: "success",
      message: `Already on the ${targetMeta.name} plan.`,
    };
  }

  const targetMeta = getTierMetaByPlanStrict(targetNormalized);
  const isDowngrade = comparison < 0;

  if (isDowngrade && !canMatchTier(overview, targetMeta)) {
    return {
      status: "error",
      message: `Reduce usage to fit the ${targetMeta.name} thresholds before downgrading.`,
    };
  }

  await prisma.enterprise.update({
    where: { id: enterpriseId },
    data: { billingTier: targetNormalized },
  });

  await prisma.auditLog.create({
    data: {
      enterpriseId,
      userId: session.user.id,
      action: "billing.plan_changed",
      resourceType: "billing_plan",
      resourceId: targetNormalized,
      details: JSON.stringify({
        from: currentNormalized,
        to: targetNormalized,
        actor: session.user.email,
      }),
    },
  });

  revalidatePath("/dashboard", "page");
  revalidatePath("/dashboard/billing", "page");

  return {
    status: "success",
    message: `${isDowngrade ? "Downgraded" : "Upgraded"} to the ${targetMeta.name} plan.`,
  };
}

export async function changePlanFormAction(formData: FormData) {
  await changePlanAction({ status: "idle" }, formData);
}
