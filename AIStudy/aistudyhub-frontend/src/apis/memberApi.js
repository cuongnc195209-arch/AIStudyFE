import api from "./api";

export async function upgradeToPremium() {
  return api.post("/member/register", {});
}

const memberApi = {
  upgradeToPremium,
};

export default memberApi;
