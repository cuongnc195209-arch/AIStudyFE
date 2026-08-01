import api from "./api";

export async function createPremiumPayment() {
  return api.post("/member/payment/create", {});
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

export async function upgradeToPremium() {
  return createPremiumPayment();
}

const memberApi = {
  createPremiumPayment,
  confirmPremiumPayment,
  upgradeToPremium,
};

export default memberApi;
