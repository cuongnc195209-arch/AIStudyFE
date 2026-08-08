import api from "./api";

export async function createPremiumPayment() {
  return api.post("/member/payment/create", null);
}

export async function confirmPremiumPayment(orderCode) {
  if (!orderCode) {
    throw new Error("Thiếu mã giao dịch");
  }

  return api.post("/member/payment/confirm", null, {
    queryParams: {
      orderCode,
    },
  });
}

export async function getMemberDetail() {
  return api.get("/member/detail");
}

export async function upgradeToPremium() {
  return createPremiumPayment();
}

export function isActiveMemberDetail(memberDetail) {
  if (!memberDetail) {
    return false;
  }

  const status = String(memberDetail.status || "").toUpperCase();

  if (status !== "ACTIVE") {
    return false;
  }

  if (!memberDetail.endDate) {
    return true;
  }

  const endDate = new Date(memberDetail.endDate);

  if (Number.isNaN(endDate.getTime())) {
    return true;
  }

  return endDate.getTime() > Date.now();
}

const memberApi = {
  createPremiumPayment,
  confirmPremiumPayment,
  getMemberDetail,
  upgradeToPremium,
  isActiveMemberDetail,
};

export default memberApi;
