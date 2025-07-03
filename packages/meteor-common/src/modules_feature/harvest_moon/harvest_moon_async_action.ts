import { createAsyncActionWithErrors } from "../../modules_utility/api_utilities/async_action_utils";
import { harvest_moon_async_functions } from "./harvest_moon_async_function";

export const harvest_moon_async_action = {
  isWalletWhitelisted: createAsyncActionWithErrors(
    harvest_moon_async_functions.isWalletWhitelisted,
  ),
  getHMAccessInfoFromBackend: createAsyncActionWithErrors(
    harvest_moon_async_functions.getAccessInfoFromBackend,
  ),
  getHarvestMoonConfig: createAsyncActionWithErrors(
    harvest_moon_async_functions.getHarvestMoonConfig,
  ),
  getHarvestMoonAccountInfo: createAsyncActionWithErrors(
    harvest_moon_async_functions.getHarvestMoonAccountInfo,
  ),
  addFunctionCallAccessKey: createAsyncActionWithErrors(
    harvest_moon_async_functions.addFunctionCallAccessKey,
  ),
  initHarvestMoonAccount: createAsyncActionWithErrors(
    harvest_moon_async_functions.initHarvestMoonAccount,
  ),
  getUnclaimedRewards: createAsyncActionWithErrors(
    harvest_moon_async_functions.getUnclaimedRewards,
  ),
  getReferralStats: createAsyncActionWithErrors(harvest_moon_async_functions.getReferralStats),
  harvest: createAsyncActionWithErrors(harvest_moon_async_functions.harvest),
  recruitTinkers: createAsyncActionWithErrors(harvest_moon_async_functions.recruitTinkers),
  getHarvestShareImage: createAsyncActionWithErrors(
    harvest_moon_async_functions.getHarvestShareImage,
  ),
  getRecruitShareImage: createAsyncActionWithErrors(
    harvest_moon_async_functions.getRecruitShareImage,
  ),
  getLeaderBoard: createAsyncActionWithErrors(harvest_moon_async_functions.getLeaderBoard),
  getLeaderBoardMission: createAsyncActionWithErrors(
    harvest_moon_async_functions.getLeaderBoardMission,
  ),
  getHarvestMoonAccountInfoForWallets: createAsyncActionWithErrors(
    harvest_moon_async_functions.getHarvestMoonAccountInfoForWallets,
  ),
  upgradeContainer: createAsyncActionWithErrors(harvest_moon_async_functions.upgradeContainer),
  upgradeLab: createAsyncActionWithErrors(harvest_moon_async_functions.upgradeLab),
  upgradeTier: createAsyncActionWithErrors(harvest_moon_async_functions.upgradeTier),
  getTier: createAsyncActionWithErrors(harvest_moon_async_functions.getTier),
  getTierConditions: createAsyncActionWithErrors(harvest_moon_async_functions.getTierConditions),
  getTierUpgradable: createAsyncActionWithErrors(harvest_moon_async_functions.getTierUpgradable),
  remindFriendHarvest: createAsyncActionWithErrors(
    harvest_moon_async_functions.remindFriendHarvest,
  ),
  getAccountAvailableRelics: createAsyncActionWithErrors(
    harvest_moon_async_functions.getAccountAvailableRelics,
  ),
  equipRelic: createAsyncActionWithErrors(harvest_moon_async_functions.equipRelic),
  unequipRelic: createAsyncActionWithErrors(harvest_moon_async_functions.unequipRelic),
  getAllRelics: createAsyncActionWithErrors(harvest_moon_async_functions.getAllRelics),
  upgradeGear: createAsyncActionWithErrors(harvest_moon_async_functions.upgradeGear),
  getRelicCapacityByGearLevel: createAsyncActionWithErrors(
    harvest_moon_async_functions.getRelicCapacityByGearLevel,
  ),
  getGearUpgradeCostByGearLevel: createAsyncActionWithErrors(
    harvest_moon_async_functions.getGearUpgradeCostByGearLevel,
  ),
  getGearLevels: createAsyncActionWithErrors(harvest_moon_async_functions.getGearLevels),
  forgeRelic: createAsyncActionWithErrors(harvest_moon_async_functions.forgeRelic),
  getRelicSlotsWithNftImage: createAsyncActionWithErrors(
    harvest_moon_async_functions.getRelicSlotsWithNftImage,
  ),
  getContractDropRate: createAsyncActionWithErrors(
    harvest_moon_async_functions.getContractDropRate,
  ),
  exchangeAssetForMoon: createAsyncActionWithErrors(
    harvest_moon_async_functions.exchangeAssetForMoon,
  ),
  exchangeAssetForContract: createAsyncActionWithErrors(
    harvest_moon_async_functions.exchangeAssetForContract,
  ),
  updateReferrer: createAsyncActionWithErrors(harvest_moon_async_functions.updateReferrer),
  getHarvestMoonTinkerFusionInfo: createAsyncActionWithErrors(
    harvest_moon_async_functions.getHarvestMoonTinkerFusionInfo,
  ),
  upgradeTinker: createAsyncActionWithErrors(harvest_moon_async_functions.upgradeTinker),
  upgradeTinkerWithGear: createAsyncActionWithErrors(
    harvest_moon_async_functions.upgradeTinkerWithGear,
  ),
  getTokenDropCampaigns: createAsyncActionWithErrors(
    harvest_moon_async_functions.getTokenDropCampaigns,
  ),
  enrollTokenDropCampaign: createAsyncActionWithErrors(
    harvest_moon_async_functions.enrollTokenDropCampaign,
  ),
};
