import { app_env } from "../../modules_app_core/env/app_env";
import { ENearNetwork } from "../../modules_external/near/types/near_basic_types";
import { fetchHelper } from "../http_utilities/FetchHelper";

const { ENV_IPFS_CACHE_URL } = app_env;

const getFtContractImgUrl = (network: ENearNetwork, contractId: string) => {
  return `${ENV_IPFS_CACHE_URL}/network/${network}/fts/${contractId}/image`;
};

const getFtContractMetadata = async (network: ENearNetwork, contractId: string) => {
  const url = `${ENV_IPFS_CACHE_URL}/network/${network}/fts/${contractId}/metadata`;
  return await fetchHelper.getJson(url);
};

const getNftContractImgUrl = (network: ENearNetwork, contractId: string) => {
  return `${ENV_IPFS_CACHE_URL}/network/${network}/nfts/${contractId}/image`;
};

const getNftContractMetadata = async (network: ENearNetwork, contractId: string) => {
  const url = `${ENV_IPFS_CACHE_URL}/network/${network}/nfts/${contractId}/metadata`;
  const metadata = await fetchHelper.getJson(url);
  return metadata;
};

const getNftTokenImgUrl = (network: ENearNetwork, contractId: string, tokenId: string) => {
  return `${ENV_IPFS_CACHE_URL}/network/${network}/nfts/${contractId}/tokens/${tokenId}/image`;
};

const getNftTokenInfo = async (network: ENearNetwork, contractId: string, tokenId: string) => {
  const url = `${ENV_IPFS_CACHE_URL}/network/${network}/nfts/${contractId}/tokens/${tokenId}/metadata`;
  const metadata = await fetchHelper.getJson(url);
  return metadata;
};

const getNftTokenImgPath = async (url: string) => {
  return await fetchHelper.getText(url);
};

export const IpfsCacheApi = {
  getFtContractImgUrl,
  getFtContractMetadata,
  getNftContractImgUrl,
  getNftContractMetadata,
  getNftTokenImgUrl,
  getNftTokenInfo,
  getNftTokenImgPath,
};
