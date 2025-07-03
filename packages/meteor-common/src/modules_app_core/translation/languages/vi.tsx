import type { DeepPartial } from "@chakra-ui/react";
import { Link } from "@chakra-ui/react";
import { ENftOfferDir } from "@meteorwallet/app/src/components/sectionComponents/transaction_components/action_components/ui_components/Component_NftTradeUI";
import { ETransactionBadgeStatus } from "@meteorwallet/app/src/services/transactions";
import { EErrorId_AccountSignerExecutor } from "@meteorwallet/core-sdk/errors/ids/by_feature/old_meteor_wallet.errors";
import { EErr_NearLedger } from "@meteorwallet/ledger-client/near/MeteorErrorNearLedger";
import { ELedgerConnectionStatus } from "@meteorwallet/ledger-client/near/near_ledger.enums";
import _ from "lodash";
import { ENearNetwork } from "../../../modules_external/near/types/near_basic_types";
import { ENearIndexer_AccessKeyPermission } from "../../../modules_external/near_public_indexer/types/near_indexer_basic_types";
import { ETransactionExecutionStatus } from "../../../modules_feature/accounts/near_signer_executor/NearAccountSignerExecutor.types";
import { EMeteorCardEstimateUsage } from "../../../modules_feature/defi_card/defi_card_constants";
import {
  EHM_UnionContractTypes,
  EHarvestMoon_Menu,
  EHarvestMoon_RelicRarity,
  EHarvestMoon_TinkerGuideModalPhase,
} from "../../../modules_feature/harvest_moon/harvest_moon_enums";
import { EMissionSubType } from "../../../modules_feature/missions/mission.dbi";
import { EChallengeStatus } from "../../../modules_feature/missions/mission_types";
import { ETransactionNotSafeId } from "../../../modules_feature/transactions/transaction_safety.types";
import { EOldMeteorErrorId } from "../../../modules_utility/old_errors/old_error_ids";
import type { ITranslations } from "../translation_types";
import { translation_en } from "./en";

export const translation_vi: ITranslations = _.defaultsDeep(
  {
    languageDisplayName: "Tiếng Việt",
    languageCode: "vi",
    bridge: {
      button_view_transaction: "Xem Giao Dịch",
      intent_pending: {
        title: "Chuyển Cầu Nối Đang Tiến Hành",
        description: "Bạn có một giao dịch cầu nối đang diễn ra. Bạn có muốn tiếp tục hay tạo mới?",
        button_create_new_bridge: "Tạo Cầu Nối Mới",
      },
      warning_no_more_transactions: "Không có giao dịch nào khác",
      warning_old_bridge:
        "Cầu nối đang chuyển sang sử dụng Intents NEAR. Nhấp vào đây để xem các giao dịch Cầu nối cũ của bạn.",
      transitioning_to_intents:
        "Cầu nối đang chuyển sang sử dụng Near Intents. Nhấp vào đây để xem cầu nối Near Intents.",
      warning_insufficient_balance: "Số dư không đủ",
      modal_add_public_key: {
        title: "Sẵn sàng sử dụng Intents NEAR?",
        description:
          "Thêm khóa công khai một lần để kích hoạt Intents NEAR và bắt đầu giao dịch của bạn.",
      },
      modal_terminate_bridge: {
        title: "Hủy Cầu Nối",
        description:
          "Bạn có chắc chắn muốn chấm dứt quá trình cầu nối hiện tại không? Bạn có thể tạo một cái mới bất cứ lúc nào.",
      },
      modal_available_balance: {
        title: "Tiếp tục với Số dư Có sẵn",
        description:
          "Bạn có một số dư có sẵn trong cầu nối, sẽ được sử dụng để xử lý giao dịch này.",
      },
      modal_similar_pair: {
        title: "Chuyển cầu nối đang tiến hành",
        description:
          "Bạn có một giao dịch cầu nối đang diễn ra. Bạn có muốn tạo một cái mới không?",
        button_create_new: "Tạo Mới",
        button_back: "Quay Lại",
        footer_note:
          "Tạo cầu nối mới sẽ hủy giao dịch trước đó và hoàn trả bất kỳ khoản tiền nào đã gửi.",
      },
      modal_refund: {
        title: "Hoàn Tiền",
        label_network: "Mạng",
        label_insert_address: "Nhập địa chỉ ví để nhận tiền hoàn lại",
        placeholder_insert_address: "Vui lòng nhập địa chỉ ví",
        label_insert_address_confirm: "Xác nhận địa chỉ ví",
        placeholder_insert_address_confirm: "Vui lòng nhập lại địa chỉ ví",
        error_invalid_address: "Địa chỉ ví không hợp lệ",
        error_address_not_match: "Địa chỉ ví không khớp",
      },
      button_cancel: "Hủy",
      button_proceed: "Tiếp Tục",
      label_reference_id: "ID Tham Chiếu",
      label_status: "Trạng Thái",
      label_refund_destination: "Điểm Đến Hoàn Tiền",
      label_source_network: "Mạng Nguồn",
      label_destination_network: "Mạng Đích",
      label_source_token: "Token Nguồn",
      label_destination_token: "Token Đích",
      label_amount_from: "Số Lượng Từ",
      label_amount_to: "Số Lượng Đến",
      label_refund_hash: "Hash Hoàn Tiền",
      label_withdrawal_hash: "Hash Rút Tiền",
      label_created_at: "Được Tạo Lúc",
      quote_result: {
        success: {
          title: "Cầu Thành Công",
          description: "Tài sản của bạn đã được chuyển thành công và hiện có sẵn trên mạng đích.",
        },
        fail: {
          title: "Cầu Thất Bại",
          description:
            "Chuyển tài sản của bạn không thể hoàn thành. Vui lòng kiểm tra chi tiết mạng và thử lại, hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.",
        },
        cancel: {
          title: "Cầu Bị Hủy",
          description: "Giao dịch cầu đã bị hủy.",
        },
      },
      button_refund: "Hoàn Tiền",
      button_continue: "Tiếp Tục",
      button_view: "Xem",
      label_transaction_processing: "Xử Lý Giao Dịch",
      label_footnote_come_back_later: "Bạn có thể đóng trang này một cách an toàn và quay lại sau",
      button_confirm_quote: "Xác Nhận Báo Giá",
      warning_large_withdrawal: "Rút tiền trên ~5,000$ có thể mất nhiều thời gian hơn để xử lý.",
      quote_header: {
        deposit: {
          title: "Bước 1 : Gửi Tiền",
          subtitle:
            "Bạn có thể đóng trang này một cách an toàn sau khi gửi tiền, vì có thể mất một thời gian để được xử lý.",
        },
        confirm_quote: {
          title: "Bước 2 : Xác Nhận Báo Giá",
          subtitle:
            "Bạn có thể đóng trang này một cách an toàn sau khi gửi tiền, vì có thể mất một thời gian để được xử lý.",
        },
        steps: {
          deposit: "Gửi Tiền",
          confirm_quote: "Xác Nhận Báo Giá",
          complete: "Hoàn Thành",
        },
      },
      label_deposit_amout: "Số Tiền Gửi",
      label_deposit_network: "Mạng Gửi Tiền",
      label_deposit_address: "Địa Chỉ Gửi Tiền",
      warning_deposit_address_title: "Vui lòng lưu ý những điều sau:",
      warning_deposit_address_desc_1:
        "Vui lòng không gửi bất kỳ tài sản kỹ thuật số nào khác ngoại trừ",
      warning_deposit_address_desc_2: "trên",
      warning_deposit_address_desc_3: "đến địa chỉ trên.",
      title: "Cầu",
      label_pay: "Trả",
      label_receive: "Nhận",
      label_from: "Từ",
      label_to: "Đến",
      label_you_send: "Bạn Gửi",
      label_you_receive: "Bạn Nhận (DỰ KIẾN)",
      label_on_network: "Trên Mạng",
      button_review_bridge: "Xem lại Cầu",
      button_confirm_bridge: "Xác nhận Cầu",
      label_bridge_details: "Chi tiết Cầu",
      label_bridge_compare: "So sánh tỷ giá giữa các nhà cung cấp",
      label_support_fees:
        "Số tiền bạn nhận được có thể thay đổi do biến động thị trường. Gửi giao dịch nhanh chóng sẽ giúp đảm bảo tỷ giá duy trì gần với tỷ giá đã báo.",
      label_fees: "Phí",
      label_slippage: "Trượt giá",
      label_on: "Trên",
      button_change: "Thay đổi",
      button_add_sender_address: "Thêm địa chỉ người gửi",
      button_add_receiver_address: "Thêm địa chỉ người nhận",
      modals: {
        network_token_selector: {
          label_select_network: "Chọn Mạng",
          label_select_token: "Chọn Token",
          hint_search_network: "Tìm kiếm Mạng",
          hint_search_token: "Tìm kiếm Token",
        },
        input_chain_address: {
          label_sender_address: "Địa chỉ người gửi",
          label_receiver_address: "Địa chỉ người nhận",
          description: "Chèn meme ở đây *nháy mắt*",
          button_confirm: "Xác nhận",
        },
        tnc: {
          tnc: "Điều khoản và điều kiện",
          rate_variability: "Biến động Tỷ giá:",
          rate_variability_desc:
            "Tỷ giá được báo có thể dao động theo tỷ giá thị trường thời gian thực. Càng lâu giao dịch hoàn tất, khả năng số tiền cuối cùng nhận được sẽ chênh lệch so với báo giá ban đầu càng cao.",
          third_party_responsibility: "Trách nhiệm của bên thứ ba:",
          third_party_responsibility_desc:
            "Dịch vụ cầu nối được tạo điều kiện bởi các đối tác bên thứ ba. Meteor Wallet chỉ hỗ trợ tìm tuyến đường tốt nhất và không chịu trách nhiệm về bất kỳ tổn thất hoặc thất bại nào nếu đối tác không thực hiện nghĩa vụ của họ.",
          disclaimer: "Tuyên bố từ chối trách nhiệm:",
          disclaimer_desc:
            "Bằng cách sử dụng dịch vụ cầu nối, bạn thừa nhận rằng Meteor Wallet không thể đảm bảo độ tin cậy hoặc tính toàn vẹn của các đối tác bên thứ ba. Mọi vấn đề hoặc tranh chấp liên quan đến cầu nối phải được giải quyết với đối tác tương ứng.",
          citizenship: "Hạn chế Quốc tịch Người dùng:",
          citizenship_desc:
            "Theo Điều khoản Sử dụng của chúng tôi, người dùng từ Hoa Kỳ, Ấn Độ, Singapore và các quốc gia bị Liên Hợp Quốc xử phạt không được phép sử dụng dịch vụ này.",
          confirm_citizenship:
            "Tôi xác nhận rằng tôi không phải là công dân của Hoa Kỳ, Ấn Độ, Singapore hoặc bất kỳ quốc gia nào bị Liên Hợp Quốc xử phạt cấm sử dụng dịch vụ này.",
          agree_tnc: "Tôi hiểu & đồng ý với ĐK&ĐK",
          hide_tnc: "Ẩn thông báo này trong tương lai",
          agree: "Đồng ý",
        },
      },
      label_bridge_history: "Lịch sử Cầu",
      label_total_records: "Tổng {count} Bản ghi",
      button_recheck: "Kiểm tra lại",
      label_swapped: "Đã nối cầu",
      title_slippage: "Cài đặt độ trượt giá",
      desc_slippage:
        "Giao dịch của bạn sẽ thất bại nếu giá thay đổi nhiều hơn độ trượt giá. Giá trị quá cao sẽ dẫn đến giao dịch không có lợi.",
      button_confirm: "Xác nhận",
      hint_bridge_result:
        "Xin lưu ý rằng bạn luôn có thể kiểm tra lịch sử giao dịch của mình tại trang lịch sử cầu.",
      label_bridge: "Cầu",
      label_success: "Thành công",
      label_failed: "Thất bại",
      label_cancelled: "Đã hủy",
      label_pending: "Đang chờ",
      label_refunded: "Đã hoàn tiền",
      label_transaction_created: "Chờ Thanh Toán",
      payment_processing: "Đang xử lý thanh toán",
      desc_bridge_success:
        "Đơn hàng cầu nối của bạn đã được tạo và thanh toán. Các tài sản đã được cầu nối/hoán đổi đang được xác nhận và sẽ sớm được chuyển đến bạn. Quá trình này thường mất 10-20 phút.",
      desc_bridge_failed:
        "Chuyển tài sản của bạn không thể hoàn thành. Vui lòng xác minh chi tiết mạng và thử lại, hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.",
      desc_bridge_created:
        "Đơn hàng của bạn đã được tạo. Bạn sẽ được chuyển hướng đến trang thanh toán để hoàn tất thanh toán trong 300 giây. Nếu bạn không được tự động chuyển hướng, vui lòng nhấp vào nút bên dưới.",
      button_back_to_wallet: "Trở lại Ví",
      button_check_transaction_status: "Kiểm tra Trạng thái Giao dịch",
      button_redirect_to_payment: "Chuyển hướng đến Thanh toán",
      label_seconds: "giây",
      meteor_derived_status: {
        failed_deposit: "Thất bại",
        pending: "Đang chờ xử lý",
        processing: "Đang xử lý",
        success: "Thành công",
        timeout: "Hết thời gian",
        refunded: "Đã hoàn tiền",
      },
      label_please_add_wallet_address: "Vui lòng thêm địa chỉ ví",
      label_no_route: "Không có tuyến đường",
      label_network_not_supported: "{network} không được hỗ trợ",
      warning_no_network_found:
        "Không tìm thấy mạng. Vui lòng thử từ khóa khác hoặc kiểm tra chính tả.",
      warning_no_token_found:
        "Không tìm thấy token. Vui lòng thử từ khóa khác hoặc kiểm tra chính tả.",
    },
    error: {
      title_1: "Rất tiếc!",
      title_2: "Đã xảy ra sự cố",
      description:
        "Đã xảy ra sự cố. Chúng tôi đang xem xét vấn đề này và báo cáo của bạn sẽ giúp chúng tôi giải quyết vấn đề nhanh hơn.",
      button_contact_support_now: "Liên hệ Hỗ trợ Ngay",
      button_back_to_wallet: "Trở lại Ví",
    },
    campaign: {
      label_voting_has_ended: "Bỏ phiếu đã kết thúc",
      what_is_new: {
        "3": {
          description: "Giới thiệu bạn bè đến Harvest Moon và giành phần của bạn từ $5.000!",
        },
        "4": {
          description:
            "Phân phối Token mới! Giới thiệu bạn bè và giành phần thưởng trị giá 3.500 đô la!",
        },
        "5": {
          description: "Đặt cược xRef trong một tuần và chia sẻ 2500 đô la!",
        },
        "6": {
          description: "Kết nối mạng giờ đây ĐƠN GIẢN, NHANH, RẺ và AN TOÀN. Thử ngay!",
        },
        "7": {
          description:
            "NHIỆM VỤ NHANH! Bỏ phiếu với $GEAR trong Mùa Meme 7 để nhận phần thưởng $50K!",
        },
        "8": {
          description:
            "Nhiệm Vụ Liên Tiếp Đã Bắt Đầu! Tham Gia Nhiệm Vụ Hàng Ngày Để Nhận Thêm Phần Thưởng!",
        },
        "9": {
          description: "Giải Thưởng $25K! Tham Gia Cuộc Thi Giao Dịch NEAR Memecoin Ngay Hôm Nay!",
        },
        "10": {
          description:
            "Tham gia cộng đồng Meteor và là một trong những người đầu tiên tận hưởng thẻ DeFi Mastercard độc quyền của chúng tôi",
        },
        "11": {
          description: "Mùa Meme 8 đã đến, bỏ phiếu cho GEAR và nhận phần thưởng hấp dẫn!",
        },
        "13": {
          description: "Mùa Meme 9 đã đến, bỏ phiếu cho GEAR và nhận phần thưởng hấp dẫn!",
        },
        "14": {
          description: "Mùa Meme 10 đã đến, bỏ phiếu cho GEAR và nhận phần thưởng hấp dẫn!",
        },
      },
      meme_phase_2: {
        my_staked_gear: "GEAR Đã Được Đặt Cọc Của Tôi",
        estimated_apy: "APY Ước Tính",
        ref_meme_contest_phase_2: "Cuộc Thi Meme Ref Giai Đoạn 2",
        gear_top_5_voted_meme_token_stake_to_earn_rewards:
          "GEAR hiện là một trong 5 token meme được bình chọn nhiều nhất. Đặt cọc GEAR để nhận phần thưởng.",
        meme_season_phase_2_stake_gear_to_earn: "Đặt cọc $GEAR và nhận lên đến 40% APY",
        staking_apy: "APY Đặt Cọc",
        stake_at_least_100_gear_for_advanced_contract:
          "Đặt cọc ít nhất 100 GEAR để nhận hợp đồng nâng cao. Thời gian mở khóa là 5 ngày.",
        step_1: {
          title: "Bước 1: Mua GEAR",
          description: "Để bắt đầu, hãy mua GEAR nếu bạn chưa có đủ để đặt cọc.",
          input_title: "Số Lượng Mua",
          input_button: "Mua",
        },
        step_2: {
          title: "Bước 2: Đặt Cọc GEAR Để Nhận Phần Thưởng",
          description:
            "Đặt cọc ít nhất 100 GEAR để nhận hợp đồng nâng cao. Thời gian mở khóa là 5 ngày.",
          input_title: "Số Lượng Đặt Cọc",
          input_button: "Đặt Cọc",
          warning_success: "Đặt Cọc GEAR Thành Công",
        },
      },
      claim_successfully: "Đã yêu cầu thành công",
      claim_reward_successfully: "Bạn đã yêu cầu phần thưởng thành công",
      raffle_rewards: "Phần Thưởng Rút Thăm",
      unstake_open_date_time_6th_sept: "Mở rút cọc vào ngày 6 tháng 9 lúc 12 giờ UTC.",
      unstake_open_date_time_7th_sept: "Mở rút cọc vào ngày 7 tháng 9 lúc 12 giờ UTC.",
      reward_open_date_time: "Phần thưởng sẽ được phát vào ngày 6 tháng 9",
      raffle_result_announcement_date_time:
        "Kết quả rút thăm sẽ được công bố vào ngày 7 tháng 9 lúc 12 giờ UTC.",
      stake_and_vote: "Đặt Cọc & Bình Chọn",
      unstake: "Rút Cọc",
      my_rewards: "Phần Thưởng Của Tôi",
      raffle_ticket: "Vé Rút Thăm",
      label_campaign_details: "Chi Tiết Chiến Dịch",
      rewards: {
        title: "Phần Thưởng Tham Gia",
        my_raffle_tickets: "Vé Rút Thăm Của Tôi",
        potential_rewards: "Phần Thưởng Tiềm Năng",
        raffle_ticket_for_each_xref_voted: "Vé Rút Thăm cho mỗi xRef Được Bình Chọn",
        label_for_participating: "để tham gia",
        label_for_each_vote: "cho mỗi xREF được bầu",
        reward_gear: "lên đến 2500 đô la GEAR sẽ được phân phối ngẫu nhiên thông qua rút thăm",
        reward_usd:
          "Chia sẻ quỹ giải thưởng trị giá 40.000 đô la tùy thuộc vào mức độ mạnh mẽ của cộng đồng chúng ta!",
        token_drop: "Phân phối Token",
        worth_of_gear_drops: "Giá trị của các đợt phân phối $GEAR",
        voting_period: "Thời gian bỏ phiếu: Đến ngày 5 tháng 10, UTC 00:00",
        snapshot_period:
          "Ảnh chụp nhanh: Ngày 6 tháng 10 (Hủy đặt cược trước ngày này sẽ không được tính)",
        unstaking_available: "Hủy đặt cược: Có sẵn vào ngày 6 tháng 10",
      },
      label_rare_relics: "Di Vật Hiếm",
      hours: "Giờ",
      minutes: "Phút",
      left: "Còn Lại",
      label_ref_contest: "Cuộc Thi Ref",
      label_ref_meme_contest: "Cuộc Thi Meme Ref - Giai Đoạn 1",
      label_ref_meme_season: "Giới thiệu MEME Mùa 6 - Giai đoạn 1",
      description_ref_meme_contest:
        "Tham gia Cuộc Thi Meme Ref và nhận phần thưởng để hỗ trợ cộng đồng Meteor và $GEAR!",
      description_ref_meme_season:
        "Tham gia Cuộc thi Ref MEME và nhận phần thưởng cho cộng đồng Meteor và $GEAR! Mỗi phiếu bầu sẽ nhận được vé rút thăm trúng thưởng cho các giải thưởng độc quyền và cơ hội giành được phần thưởng trị giá 40.000 đô la—với nhiều phần thưởng hơn khi số phiếu bầu của chúng tôi tăng lên!",
      label_how_to_participate: "Cách Tham Gia",
      label_get_guaranteed_reward: "Nhận Hợp Đồng Nâng Cao Đảm Bảo",
      label_stand_a_chance_to_win: "Có Cơ Hội Để Thắng",
      label_my_entry: "Bài Dự Thi Của Tôi",
      text_campaign: "Mùa meme đang diễn ra, tham gia để nhận phần thưởng.",
      label_milestone: "Cột Mốc",
      label_votes_casted: "Số Phiếu Đã Bình Chọn",
      step_1: {
        title: "Bước 1: Mua Ref",
        description: "Bạn cần REF để tham gia cuộc thi MEME và đặt cọc xREF",
        input_title: "Số Lượng Mua",
        input_button: "Mua",
      },
      step_2: {
        title: "Bước 2: Đặt Cọc Ref Để Nhận xRef",
        description: "Token xREF cho bạn quyền bình chọn và bạn hiện có",
        input_title: "Số Lượng Đặt Cọc",
        input_button: "Đặt Cọc",
        warning_success: "Đặt Cọc xRef Thành Công",
      },
      step_3: {
        title: "Bước 3: Bình Chọn Cho Gear",
        description: "Mỗi phiếu bình chọn sẽ nhận được một vé rút thăm và bạn hiện có",
        input_title: "Số Lượng Bình Chọn",
        input_button: "Bình Chọn",
        warning_success: "Bình Chọn Cho GEAR Thành Công",
      },
      step_unstake_xref_token: {
        title: "Rút Cọc Token xRef",
        description: "Lưu ý rằng sẽ có thời gian khóa ~{LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} giờ",
        label_locking_period: "Thời Gian Khóa",
        label_total_staked_amount: "Tổng Số Đã Đặt Cọc",
        input_title: "Số Lượng Rút Cọc",
        input_button: "Rút Cọc",
        warning_unstake_success: "Rút Cọc xRef Thành Công",
        warning_withdraw_success: "Rút xRef Thành Công",
        description_unstaking:
          "Bạn đang rút cọc {balanceUnstaking} Token xRef. Thường mất {LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} giờ để hoàn thành",
        description_claimReady:
          "Bạn có {balanceClaimReady} Token xRef sẵn sàng để yêu cầu, nhấp để yêu cầu ngay",
      },
      step_unstake_ref_token: {
        title: "Hủy đặt cược Token Ref",
        description:
          "Hủy đặt cược ngay lập tức có sẵn cho Token Ref. Bạn có thể hủy đặt cược bất cứ lúc nào",
        label_total_staked_amount: "Tổng Số Tiền Đã Đặt Cược",
        input_title: "Số Tiền Để Hủy Đặt Cược",
        input_button: "Hủy Đặt Cược",
        warning_unstake_success: "Hủy Đặt Cược Token Ref Thành Công",
      },
      step_unstake_gear_token: {
        title: "Rút Cọc Token GEAR",
        description: "Lưu ý rằng sẽ có thời gian khóa ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} ngày",
        label_locking_period: "Thời Gian Khóa",
        label_total_staked_amount: "Tổng Số Đã Đặt Cọc",
        input_title: "Số Lượng Rút Cọc",
        input_button: "Rút Cọc",
        warning_unstake_success: "Rút Cọc GEAR Thành Công",
        warning_withdraw_success: "Rút GEAR Thành Công",
        description_unstaking:
          "Bạn đang rút cọc {balanceUnstaking} Token GEAR. Thường mất ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} ngày để hoàn thành",
        description_claimReady:
          "Bạn có {balanceClaimReady} Token GEAR sẵn sàng để yêu cầu, nhấp để yêu cầu ngay",
        label_lock_up_period: "Thời Gian Khóa",
        label_days: "Ngày",
        label_apy: "APY",
      },
      label_you_have_gear: "Bạn Có {prettyGearBalance} GEAR",
      label_reward_details: "Chi Tiết Phần Thưởng",
      label_participation_reward: "Phần Thưởng Tham Gia",
      description_participation_reward: "Phần thưởng khi bạn tham gia cuộc thi này",
      label_milestone_reward: "Phần Thưởng Cột Mốc",
      description_milestone_reward:
        "Mỗi cột mốc thêm nhiều mục vào hồ bơi rút thăm. Mỗi vé rút thăm cho bạn cơ hội để nhận phần thưởng.",
      label_my_raffle_tickets: "Vé Rút Thăm Của Tôi",
      label_raffle_rewards_in_milestone: "Phần Thưởng Rút Thăm Trong Cột Mốc",
      label_when_total_ticket_reached: "Khi Tổng Số Vé Đạt Được",
      label_dont_see_your_raffle_ticket: "Không nhận được vé rút thăm của bạn? Kiểm tra",
      label_dont_see_your_rewards: "Không nhận được phần thưởng của bạn? Kiểm tra",
      label_here: "ở đây",
      title_claim_raffle_ticket: "Yêu Cầu Vé Rút Thăm",
      description_claim_raffle_ticket:
        "Tìm các băm giao dịch liên quan đến việc bình chọn cho GEAR",
      label_input_transaction_hash: "Nhập băm giao dịch",
      warning_claim_raffle_ticket_success: "Yêu Cầu Vé Rút Thăm Thành Công",
      button_claim: "Yêu Cầu",
      button_claimed: "Đã Yêu Cầu",
      label_coming_soon: "Sắp Ra Mắt",
      label_staking_rewards: "Phần Thưởng Đặt Cọc",
      label_list_of_registered_entries: "Danh Sách Các Mục Đã Đăng Ký",
      label_no_registered_entries: "Không Có Mục Đã Đăng Ký",
      button_dropped: "Đã Rơi",
      label_you_didnt_win: "Bạn không trúng bất kỳ phần thưởng rút thăm nào",
      label_coming_soon_unstaking: "Hủy đặt cược sẽ có sẵn vào ngày 6 tháng 10",
      label_coming_soon_raffle: "Phần thưởng rút thăm sẽ có sẵn vào ngày 6 tháng 10",
    },
    rpc_rotate_modal: {
      rotating_rpc: "RPC đã chọn không hoạt động — thay đổi ngay.",
      selected_rpc_not_working_change_to_other:
        "RPC hiện tại không hoạt động như mong đợi. Chúng tôi khuyên bạn nên thay đổi thành {rpcName}.",
      change_now: "Thay đổi ngay",
      all_rpc_down:
        "Giao thức NEAR đang gặp sự cố mạng, khiến tất cả các RPC tạm thời không khả dụng. Các giao dịch có thể bị chậm trễ và một số tính năng có thể không hoạt động.",
    },
    configure_rpc: {
      title: "Trình Chọn RPC",
      description: "Thay đổi mạng RPC sẽ làm mới ứng dụng",
      button_add_rpc: "Thêm RPC",
      warning_success_update_rpc: "Bạn đã thay đổi nhà cung cấp RPC của mình thành công sang {rpc}",
      warning_rpc_abnormal_ping:
        "Ping RPC không bình thường, chúng tôi đề nghị thay đổi sang RPC khác.",
      warning_duplicate_entry: "Phát hiện mục nhập RPC trùng lặp.",
      label_add_custom_network: "Thêm Mạng Tùy Chỉnh",
      label_network_name: "Tên Mạng",
      label_rpc_url: "URL RPC",
      button_add: "Thêm",
      button_confirm_change_rpc: "Xác nhận",
      rpcNames: {
        mainnet: {
          official: "RPC Chính Thức",
          meteor: "RPC Meteor FastNear",
          fastnear: "RPC FastNear",
          pagoda: "RPC Pagoda",
          lava: "RPC Lava",
          shitzu: "RPC Shitzu",
        },
        testnet: {
          official: "RPC Chính Thức testnet",
          fastnear: "RPC FastNear testnet",
          pagoda: "RPC Pagoda testnet",
          lava: "RPC Lava testnet",
        },
      },
      warning_changed_network: "Mạng đã được thay đổi thành {network}",
      hint_switch_network: "Nhấn CTRL + . để nhanh chóng chuyển đổi giữa các mạng",
    },
    wallet_status: {
      "": "",
      account_exists: "Bạn có thể thay đổi người giới thiệu của mình sang tài khoản này",
      account_no_exists: "Ví không tồn tại",
      new_referrer_same_as_old_referrer:
        "Người giới thiệu không hợp lệ: Người giới thiệu mới không thể giống với người giới thiệu cũ.",
      current_lab_level_exceed_1:
        "Lỗi: Bạn đã cập nhật phòng thí nghiệm của mình và không thể thay đổi người giới thiệu nữa.",
      new_referrer_harvest_moon_not_init:
        "Người giới thiệu không hợp lệ: Người giới thiệu chưa khởi tạo tài khoản trăng thu hoạch.",
      new_referrer_not_tg_linked:
        "Người giới thiệu không hợp lệ: Người giới thiệu phải là ví chính được xác minh bởi Telegram.",
      new_referrer_must_be_primary_wallet:
        "Người giới thiệu không hợp lệ: Người giới thiệu phải là ví chính được xác minh bởi Telegram.",
      "responder_production_rate_exceed_0.1": "Lỗi: Tỷ lệ sản xuất của bạn vượt quá 0,1",
      error_checking: "Lỗi: Đã xảy ra sự cố, vui lòng thử lại sau.",
    },
    changelog: {
      abuse: {
        title_1: "Cập nhật quan trọng",
        title_2: "Về tài khoản Harvest Moon của bạn",
        text_1: "Do lỗi gần đây trong Moon Exchange, bạn đã nhận được",
        text_2: "với mức giảm giá 50% trước khi lỗi được sửa vào",
        text_3: "Để đảm bảo công bằng, chúng tôi đã xóa các mục sau khỏi tài khoản của bạn",
        text_4: "Để bù đắp cho sự bất tiện này, chúng tôi tặng bạn 1 Hợp đồng Chuyên gia.",
        text_5: "Để biết thêm thông tin, vui lòng nhấp vào nút Tìm hiểu thêm bên dưới.",
        text_6: "Bằng cách đánh dấu, bạn xác nhận rằng bạn đã đọc và hiểu bản cập nhật.",
        label_contracts: "Hợp đồng",
        button_view_transaction: "(Xem Giao dịch)",
        button_learn_more: "Tìm hiểu thêm",
        button_understood: "Đã hiểu",
      },
      label_whats_new: "Có gì mới :",
      close: "đóng",
      "15": {
        title: "NẤU ĂN MEME",
        description_1:
          "Nền tảng khởi chạy công bằng đầu tiên thuộc loại này hiện đang hoạt động trên Near Protocol. Tham gia ngay vào",
        description_2: "chiến dịch giao dịch của họ!",
        button: "Nấu Ngay",
      },
      "16": {
        title: "NHẬP TOKEN",
        description:
          'Không thấy số dư token của bạn? Nhập chúng ngay bây giờ ở cuối phần "Tài Sản Của Tôi" trên trang chủ',
        button: "Kiểm tra ngay",
      },
      "17": {
        simple: "ĐƠN GIẢN",
        fast: "NHANH",
        cheap: "RẺ",
        secure: "AN TOÀN",
        title: "Kết nối mạng giờ đây {simple}, {fast}, {cheap} và {secure}",
        description:
          "Dễ dàng di chuyển crypto của bạn qua các mạng (ETH, SOL, BNB, ARB, v.v.), tất cả trong Ví Meteor của bạn. Cross-chain dễ dàng hơn bao giờ hết!",
        button: "Kết nối ngay!",
      },
      "18": {
        title: "Nhiệm vụ Streak đã được triển khai",
        description:
          "Thực hiện nhiệm vụ hàng ngày—giao dịch memecoin, token cầu, Tinkers du hành thời gian. Duy trì streak để nhận phần thưởng lớn hơn!",
        button: "Bắt đầu nhiệm vụ",
      },
      "19": {
        title: "Thử thách Memecoin Đang Diễn Ra!",
        description:
          "Giao dịch memecoin ngay bây giờ để có cơ hội giành phần của bạn trong $25.000! Tăng chuỗi giao dịch của bạn để nhận phần thưởng lớn hơn. Top 10 nhà giao dịch nhận được phần thưởng gấp 10 lần.",
        button: "Đăng ký ngay",
      },
      "20": {
        title: "Truy cập sớm",
        subtitle: "Đăng ký ngay để được truy cập sớm và tận hưởng những lợi ích độc quyền",
        button: "Đăng ký ngay!",
      },
    },
    footer: {
      home: "Trang chủ",
      nft: "NFT",
      game: "$MOON",
      history: "Lịch sử",
      explore: "Khám phá",
    },
    topup: {
      title: "Nạp tiền",
      label_intro_1: "Nhận",
      label_intro_2: "trong vài giây",
      label_buy_with: "Mua với",
      label_recommended: "Được khuyến nghị",
      label_payment_options: "Tùy chọn thanh toán",
      text_mercuryo_description:
        "Mua tiền mã hóa trực tiếp trong Meteor Wallet, không cần tài liệu.",
      text_onramper_description: "Bộ tổng hợp có tất cả các cổng fiat sang crypto chính.",
      text_ramp_description: "Bộ tổng hợp có tất cả các cổng fiat sang crypto chính.",
      toast: {
        topup_success_title: "Nạp tiền thành công",
        topup_success_description: "Tiền của bạn đã được thêm vào tài khoản",
        topup_failed_title: "Nạp tiền thất bại",
        topup_failed_description: "Vui lòng thử lại sau",
      },
    },
    staking: {
      label_staking_apy: "Lợi nhuận hàng năm",
      label_total_staked: "Tổng cược",
      label_total_delegators: "Tổng số người ủy quyền",
      label_daily_moon_drop: "Số $MOON giảm hàng ngày",
      label_total_moon_earned: "Tổng $MOON kiếm được",
      label_per_day: "Mỗi ngày",
      label_start_staking: "Bắt đầu đặt cược",
      label_boosted: "ĐÃ TĂNG",
      hint_staking_apy:
        "Lợi tức phần trăm hàng năm từ việc đặt cược token NEAR của bạn phụ thuộc vào điều kiện mạng.",
      hint_total_staked: "Bao gồm tiền gửi ban đầu và phần thưởng đã được cược lại tự động.",
      hint_total_delegators: "Số ví duy nhất đang đặt cược trên người xác thực này.",
      hint_daily_moon_drop:
        "Token $MOON nhận được hàng ngày dựa trên số NEAR bạn đã cược. Số tiền nhận được được tính hàng giờ dựa trên NEAR bạn đã cược.",
      hint_total_moon_earned:
        "Tổng số token $MOON kiếm được từ việc đặt cược với Người xác thực Meteor.",
      button_stake_more: "Stake thêm",
      button_unstake: "Rút stake",
      button_claim: "Yêu cầu",
      button_start_now: "Bắt đầu ngay",
      part_unstaking: {
        title: "Rút stake",
        description:
          "Bạn đang rút {balanceUnstaking} NEAR từ người xác nhận, việc này thường mất 48~72 giờ để hoàn thành",
      },
      part_unstaked: {
        title: "Đã rút stake",
        description:
          "Bạn có {balanceClaimReady} NEAR  phần thưởng chưa được yêu cầu, nhấp để yêu cầu ngay",
      },
      part_extra_reward: {
        title: "Phần thưởng thêm",
        description:
          "Bạn có {balanceExtraReward} phần thưởng chưa được yêu cầu, nhấp để yêu cầu ngay",
      },
      part_extra_reward_meteor: {
        title: "Bạn Đang Nhận Được Phần Thưởng Thêm!",
        description_1:
          "Bạn sẽ kiếm được token $MOON mỗi ngày, được ghi vào tài khoản của bạn vào {STAKING_AUTO_CLAIM_TIME}. Kiểm tra",
        description_2: "hoạt động ví",
        description_3: "của bạn để xem chúng.",
      },
      part_unclaimed_reward: {
        title: "Phần thưởng chưa được nhận",
        description:
          "Bạn có {balanceExtraReward} $MOON phần thưởng chưa được nhận, bắt đầu hành trình Harvest Moon của bạn để nhận",
      },
      section_stakings: {
        title: "Staking của tôi",
        button_create_staking: "Tạo staking",
      },
      section_staking_stats: {
        title_1: "Kiếm với",
        title_2: "Staking",
        description:
          "Kiếm phần thưởng lên đến {STAKING_UP_TO_APY}% APY bằng cách staking NEAR trong Meteor.",
        label_my_total_stakings: "Tổng số staking của tôi",
        label_estimated_apy: "APY ước tính",
      },
      subpage_create: {
        title: "Đặt cược NEAR của bạn",
        label_year: "năm",
        label_everyday: "hàng ngày",
        label_validator: "Người xác thực",
        label_staking_details: "Chi tiết Staking",
        label_reward: "Lợi nhuận hàng năm",
        label_estimated_yield: "Lợi nhuận dự kiến",
        label_extra_reward: "Phần Thưởng Bổ Sung",
        label_extra_daily_reward_in_moon: "Phần Thưởng Hàng Ngày Thêm vào",
        label_select_validator: "Chọn Người xác thực",
        label_delegators: "Người ủy quyền",
        hint_reward:
          "Lợi tức phần trăm hàng năm từ việc đặt cược token NEAR của bạn phụ thuộc vào điều kiện mạng.",
        hint_estimated_yield:
          "Lợi nhuận hàng năm ước tính bằng USD dựa trên tỷ lệ staking hiện tại và số lượng bạn đặt cược. Lợi nhuận thực sự sẽ được trả bằng token NEAR.",
        hint_extra_reward:
          "Kiếm thêm token $MOON hàng ngày như một phần thưởng staking. Những token này đủ điều kiện để nhận phần thưởng Meteor trong tương lai, như airdrop chính thức của chúng tôi.",
        button_stake_now: "Đặt cược ngay",
        warning_unstake_period: "Có một khoảng thời gian khóa từ 48~72 giờ trong quá trình unstake",
      },
      toast: {
        unstake_success_title: "Bạn đã rút stake thành công",
        unstake_success_description: "Bạn đã rút thành công {unstakeAmount} NEAR từ {validatorId}",
        unstake_failed_title: "Rút stake thất bại",
        unstake_failed_description: "Yêu cầu phần thưởng staking thất bại: {message}",
        claim_success_title: "Yêu cầu thành công",
        claim_success_description:
          "Bạn đã yêu cầu thành công phần thưởng staking của bạn {amount} NEAR",
        claim_failed_title: "Có lỗi xảy ra",
        claim_failed_description: "Yêu cầu phần thưởng staking thất bại: {message}",
        claim_farm_success_title: "Phần thưởng staking đã được yêu cầu thành công",
        claim_farm_success_description: "Bạn đã yêu cầu thành công phần thưởng staking của bạn",
        claim_farm_failed_title: "Có lỗi xảy ra",
        claim_farm_failed_description: "Yêu cầu phần thưởng staking thất bại: {message}",
        no_claim_title: "Không có phần thưởng có thể yêu cầu",
        no_claim_description: "Không có phần thưởng có thể yêu cầu",
      },
      modal: {
        unstake: {
          title: "Rút stake",
          label_amount_to_unstake: "Số lượng để rút stake",
          label_validator_details: "Chi tiết người xác nhận",
          label_provider: "Nhà cung cấp",
          label_staking_apy: "APY Staking",
          label_unlock_period: "Khoảng thời gian mở khóa",
          label_total_staked_amount: "Tổng số lượng đã staking",
          button_confirm_unstake: "Xác nhận rút stake",
        },
        stake: {
          label_stake_success: "Stake thành công",
          label_stake_failed: "Stake thất bại",
          label_transaction_details: "Chi tiết giao dịch",
          label_status: "Trạng thái",
          label_success: "Thành công",
          label_failed: "Thất bại",
          label_date_time: "Ngày & Giờ",
          label_transaction_fee: "Phí giao dịch",
          label_transaction_id: "ID giao dịch",
          label_error_message: "Thông báo lỗi",
          button_done: "Hoàn tất",
        },
      },
    },
    telegram: {
      linking_wallet_to_account: "Liên kết ví với tài khoản Telegram",
      quote_of_the_day: "Trích dẫn của ngày",
      modal: {
        conflict_account: {
          title: "Bạn đã có một ví được liên kết với tài khoản Telegram của bạn",
          text_import: "Bạn có thể nhập",
          text_import_or_create: "nhập ví khác hoặc tạo một ví mới",
          text_if_import_or_create: "Nếu bạn nhập ví khác hoặc tạo một ví mới",
          text_telegram_account_override:
            "tài khoản Telegram của bạn sẽ được liên kết với ví mới thay thế",
          button_import_existing: "Nhập",
          button_import_another: "Nhập ví khác",
          button_create_new: "Tạo ví mới",
          label_or: "hoặc",
        },
        connect_account: {
          title: "Liên kết Tài khoản Telegram",
          description:
            "Chỉ một tài khoản ví có thể được liên kết với tài khoản Telegram của bạn. Một tính năng trong tương lai sẽ cho phép bạn thay đổi ví đã liên kết.",
          button_continue: "Tiếp tục",
        },
        import_linked_account: {
          title: "Nhập tài khoản hiện tại của bạn",
          description:
            "Bạn có thể nhập tài khoản hiện tại của mình bằng cách sử dụng cụm từ bí mật hoặc khóa riêng của bạn",
          text_choose_import_method: "Chọn phương thức nhập",
          button_next: "Tiếp",
          button_back: "Quay lại",
        },
      },
    },
    harvest_moon: {
      tab_harvest: {
        ledger: {
          title: "Quyền truy cập bảo mật cho người dùng {LedgerComponent}",
          description:
            "Đối với người dùng Ledger, việc thêm khóa truy cập chức năng là cần thiết để có trải nghiệm liền mạch trên Harvest Moon. Khóa này chỉ dành cho chức năng giao diện và không cấp cho chúng tôi quyền truy cập vào quỹ hoặc khóa ví cá nhân của bạn. Tài sản của bạn hoàn toàn thuộc quyền kiểm soát của bạn.",
          add_now: "Thêm ngay",
        },
        section_dashboard: {
          label_storage: "Bộ nhớ",
          label_my_moon_balance: "Số dư $MOON của tôi",
          button_next_harvest: "Mùa gặt tiếp theo",
        },
        section_game_stats: {
          title: "THỐNG KÊ TRÒ CHƠI",
          label_coming_soon: "Sắp ra mắt",
          text_news_mechanic: "Cơ chế Trò chơi và Phần thưởng",
          text_news_guide: "Hướng dẫn Trò chơi",
          text_news_launch_week: "Tuần lễ ra mắt Harvest Moon đã đến",
          text_news_hm_missions: "Nhiệm vụ Harvest Moon",
          button_relic_booster: "Bộ Kích hoạt Di tích",
          button_player_level: "Cấp độ Người chơi",
          button_ranking: "Xếp hạng",
          button_contract_drop: "Hợp đồng Rơi",
          button_token_drop: "Token Rơi",
          button_referral: "Giới thiệu",
          label_enrolled: "Đã đăng ký",
        },
        section_announcement: {
          title: "THÔNG BÁO",
        },
        subpage_tier: {
          title: "Cấp độ người chơi",
          label_current_tier: "Cấp độ hiện tại",
          label_conditions_to_unlock: "Điều kiện để mở khóa",
          label_current_benefits: "Lợi ích hiện tại",
          label_upgrade_to_unlock: "Nâng cấp để mở khóa",
          label_coming_soon: "SẮP RA MẮT",
          button_uprgade_tier: "NÂNG CẤP CẤP ĐỘ",
          button_uprgade_tier_locked: "NÂNG CẤP (ĐÃ KHÓA)",
        },
        subpage_referral: {
          title: "Giới thiệu",
          label_last_7_days_earned_from_referral: "Thu nhập 7 ngày qua từ giới thiệu",
          text_moon_earned_by_referral_is_distributed_to:
            "Moon kiếm được từ giới thiệu được phân phối đến {walletId}",
          label_your_primary_wallet: "ví chính của bạn",
          label_my_total_friends: "Tổng số bạn bè của tôi",
          button_copy_referral_link: "Sao chép",
          label_total_moon_earned_from_referral: "Tổng $MOON kiếm được từ giới thiệu (7 ngày qua)",
          label_my_friends: "Bạn bè của tôi",
          label_total_records: "Tổng số {count} hồ sơ",
          label_total_moon_earned: "Tổng $MOON kiếm được",
          label_refer_and_earn: "Giới thiệu & Nhận thưởng",
          label_refer_and_earn_desc: "Giới thiệu một người bạn để nhận",
          label_refer_and_earn_desc_2: "20% của phần thưởng $MOON",
          label_refer_and_earn_desc_3: "và một",
          label_refer_and_earn_desc_4: "Hợp đồng Cơ bản",
          label_level: "Cấp độ",
          label_wallet_id: "ID Ví",
          label_telegram_id: "ID Telegram",
          label_last_harvest_at: "Lần thu hoạch cuối cùng tại",
          button_remind_to_harvest: "Nhắc nhở thu hoạch",
          button_share_on_tg: "Chia sẻ trên TG",
          button_share_on_x: "Chia sẻ trên X",
        },
        subpage_contract_drop: {
          title: "Hợp đồng Rơi",
          label_my_union_contract_drop_stats: "Thống kê Hợp đồng Liên minh của tôi",
          text_chance_of_getting_contract_at_full_storage:
            "Cơ hội nhận được Hợp đồng khi Lưu trữ đầy",
          label_union_contract_drop_rate: "Tỷ lệ Rơi Hợp đồng Liên minh",
          text_union_contract_drop_rate:
            "Cơ hội của bạn để nhận được hợp đồng liên minh tăng lên với số giờ bạn thu hoạch. Nâng cấp lưu trữ của bạn cho phép bạn thu hoạch nhiều giờ hơn (từ 2h đến 24h), tăng cơ hội của bạn. Tỷ lệ rơi tối đa mỗi lần thu hoạch là {dropRatePerHour}%.",
          label_union_contract_type: "Loại Hợp đồng Liên minh",
          text_union_contract_type:
            "Mở khóa các loại hợp đồng liên minh khác nhau bằng cách lên cấp. Cấp độ người chơi cao hơn cho phép bạn truy cập vào các hợp đồng hiếm hơn. Tỷ lệ rơi cải thiện với các cấp độ lưu trữ cao hơn. Ví dụ, hợp đồng chuyên gia có tỷ lệ rơi 1% ở cấp độ lưu trữ 1 nhưng tăng lên 15% ở cấp độ lưu trữ 9.",
          button_upgrade_storage: "Nâng cấp Lưu trữ",
          button_check_player_level: "Kiểm tra Cấp độ Người chơi",
        },
        subpage_token_drop: {
          title: "Phân Phối Token",
          title_token_drop: "Phân Phối Token",
          desc_token_drop:
            "Có cơ hội nhận thêm token khi bạn đáp ứng các tiêu chí của chiến dịch trong quá trình thu hoạch.",
          label_campaign: "Chiến dịch",
          label_met_criteria: "Đủ điều kiện",
          label_not_met_criteria: "Không đủ điều kiện",
          label_enrolled: "Đã đăng ký",
          label_rewards: "Phần thưởng",
          label_period: "Thời gian",
          label_claimed_rewards: "Phần thưởng đã nhận",
          button_view_details: "Xem Chi tiết",
          button_enroll: "Đăng ký",
          label_criteria: "Tiêu chí",
          label_completed: "Hoàn thành",
          label_incomplete: "Chưa hoàn thành",
          label_player_level: "Cấp độ người chơi",
          text_staked_at_least_100_near:
            "Đã đặt cược (liên kết) ít nhất 100 Near với Meteor Validator",
          button_enroll_now: "Đăng ký ngay",
          campaigns: {
            title: {
              referral_token_drop_2: "Giới thiệu & Kiếm tiền",
              gear_token_drop: "Du hành Thời gian & Kiếm tiền",
              lonk_token_drop: "Thử thách Người mới",
              memecoin_token_drop: "Giao Dịch Memecoin",
              swap_mission_drop: "Thử thách Memecoin",
            },
            description: {
              referral_token_drop_2:
                "Mời bạn bè của bạn và nhận phần thưởng từ quỹ giải thưởng trị giá 3.500 đô la! Sự kiện diễn ra cho đến khi quỹ giải thưởng được nhận hết, vì vậy hãy bắt đầu giới thiệu ngay bây giờ!",
              swap_mission_drop:
                "Tham gia các nhiệm vụ giao dịch Memecoin hàng ngày và cạnh tranh để giành phần của bạn trong prize pool trị giá 25.000 USDC! Sự kiện diễn ra cho đến khi pool được yêu cầu hoàn toàn, vì vậy hãy bắt đầu giao dịch ngay bây giờ!",
            },
            how_it_works: {
              referral_token_drop_2: {
                step_1:
                  "Giới thiệu ít nhất <b>1 người dùng mới tuyển dụng 5 Tinkers.</b> Khi đủ điều kiện, lần thu hoạch tiếp theo của bạn có 50% cơ hội nhận thêm phân phối token <i>(Cơ hội tối đa với thu hoạch 4 giờ)</i>",
                step_2:
                  "<b>Kiếm từ 0,05 đô la đến 10 đô la trong phần thưởng token.</b> Càng nhiều giới thiệu, phần thưởng càng lớn!",
                step_3:
                  "Tổng cộng 120B Black Dragon (~3.500 đô la) sẽ được phân phối trong chiến dịch này.",
                label_distributed: "Đã phân phối",
                label_remaining: "Còn lại",
              },
              swap_mission_drop: {
                step_1_title: "Hoàn thành chuỗi 5 ngày",
                step_1_description:
                  "Giao dịch memecoin trong 5 ngày liên tiếp để mở khóa cơ hội 50% nhận thêm token thưởng ở mỗi lần thu hoạch. Xem các memecoin đủ điều kiện.",
                step_2_title: "Phần thưởng",
                step_2_description:
                  "Nhận phần thưởng hàng ngày dựa trên thu hoạch 24 giờ, từ $0,75 đến $2,50, tùy thuộc vào chuỗi của bạn và yếu tố ngẫu nhiên. Thu hoạch ngắn hơn có nghĩa là phần thưởng nhỏ hơn. Top 10 nhà giao dịch (theo khối lượng) có thể nhận được phần thưởng gấp 10 lần, lên đến $25 mỗi ngày.",
                step_3_title: "Tổng Giải Thưởng",
                step_3_description:
                  "Tổng cộng $25.000 USDC sẽ được phân phối trong suốt chiến dịch.",
                label_distributed: "Đã phân phối",
              },
            },
            my_progress: {
              swap_mission_drop: {
                complete_5_days_streak: "Hoàn thành chuỗi 5 ngày để đủ điều kiện.",
                total_campaign_earnings: "Tổng Thu Nhập Chiến Dịch",
                earn_bonus_rewards: "Nhận Thưởng Thêm",
                top_10_trades_get: "Top 10 Giao Dịch Nhận Được",
                rewards: "Phần Thưởng",
                top_10_traders: "Top 10 Nhà Giao Dịch",
              },
            },
          },
          label_not_enrolled: "Chưa đăng ký",
          label_criteria_unmet: "Không đáp ứng tiêu chí",
          label_status: "Trạng thái",
          tooltip_status:
            "Đã đăng ký: Bạn đang trong phân phối token. Không đáp ứng tiêu chí: Không đáp ứng yêu cầu. Chưa đăng ký: Bạn chưa đăng ký.",
          label_until_reward_empty: "Cho đến khi quỹ phần thưởng cạn kiệt",
          campaign_status: {
            ACTIVE: "Hoạt động",
            ENDED: "Kết thúc",
            PAUSED: "Tạm dừng",
          },
          label_how_it_works: "Cách thức hoạt động",
          label_my_progress: "Tiến độ của tôi",
          label_qualification_status: "Trạng thái đủ điều kiện",
          label_recent_activity: "Hoạt động gần đây",
          label_you_have_referred: "Bạn đã giới thiệu",
          label_users: "người dùng",
          description_qualification_status:
            "Giới thiệu chỉ được tính sau khi họ tuyển dụng 5 Tinkers, và chỉ những giới thiệu mới từ chiến dịch này mới đủ điều kiện.",
          label_referral_activity: "Hoạt động giới thiệu",
          label_tinkers: "Tinkers",
          label_prize_pool: "Quỹ giải thưởng",
          label_up_to: "Lên đến",
          label_each_harvest: "mỗi lần thu hoạch",
          tooltip_rewards: "Phần thưởng được tính dựa trên giá token theo thời gian thực.",
          button_coming_soon: "Sắp ra mắt",
        },
        modal: {
          gas_free: {
            title:
              "Với giao dịch không tốn gas, chúng tôi chịu phí để gameplay Harvest Moon diễn ra mượt mà!",
            button_close: "ĐÓNG",
          },
          upgrade_tier: {
            title: "Nâng cấp cấp độ",
            label_upgrade_to_unlock: "Nâng cấp để mở khóa",
            button_upgrade_now: "Nâng cấp ngay",
          },
          my_referrer: {
            label_my_referrer: "Người Giới Thiệu Của Tôi",
            label_wallet_id: "ID Ví",
            label_telegram_id: "ID Telegram",
            label_status: "Trạng Thái",
            label_lab_level: "Cấp Độ Phòng Thí Nghiệm",
            button_update_referrer: "Cập Nhật Người Giới Thiệu",
            footer_text:
              "Bạn chỉ có thể thay đổi người giới thiệu nếu tỷ lệ sản xuất của bạn dưới 0,1 $MOON/giờ.",
            label_active: "Hoạt Động",
            label_inactive: "Không Hoạt Động",
            label_update_referrer: "Cập Nhật Người Giới Thiệu",
            label_referrer_wallet_id: "ID Ví Người Giới Thiệu",
            button_confirm: "Xác Nhận Cập Nhật",
            button_cancel: "Hủy",
          },
        },
        toast: {
          tier_upgrade_success: "Nâng cấp cấp độ thành công",
          link_telegram_failed: "Liên kết đến telegram thất bại. Vui lòng thử lại.",
          referral_telegram_failed: "Bạn đã tạo/nhập ví. Liên kết giới thiệu không hợp lệ.",
          referred_and_get_reward_with_name:
            "Bạn được giới thiệu bởi {referrer} và sẽ nhận được phần thưởng bổ sung sau khi hoàn tất tạo tài khoản.",
          referred_and_get_reward_without_name:
            "Bạn được giới thiệu và sẽ nhận được phần thưởng bổ sung sau khi hoàn tất tạo tài khoản.",
        },
      },
      tab_mission: {
        newbie_challenge: {
          newbie: "Người mới",
          challenge: "Thử thách",
          of: "của",
          description:
            "Nâng cấp và cải thiện thiết lập của bạn để nhận phần thưởng và nâng cao trải nghiệm chơi game của bạn!",
          prev: "Trước",
          next: "Tiếp theo",
          task: "Nhiệm vụ",
          task_1: {
            join_harvest_moon: "Tham gia Harvest Moon",
            receive_basic_contract: "Nhận phần thưởng Hợp đồng Cơ bản!",
          },
          task_2: {
            reach_player_level_3: "Đạt Cấp độ Người chơi 3",
            receive_advanced_contract: "Nhận phần thưởng Hợp đồng Nâng cao!",
          },
          task_3: {
            reach_container_level_3: "Đạt Cấp độ Container 3",
            reach_lab_level_3: "Đạt Cấp độ Phòng thí nghiệm 3",
            receive_expert_contract: "Nhận phần thưởng Hợp đồng Chuyên gia!",
            button_upgrade_now: "Nâng cấp Ngay",
          },
        },
        new_missions: {
          active_forever: "Hoạt động mãi mãi",
          active_for: "Hoạt động trong",
          vote: "Bỏ phiếu",
          surprise_partnership_title: "Hợp Tác Bất Ngờ",
          surprise_partnership_desc: "Mở khóa các cách mới để chi tiêu tiền điện tử",
          meteor_master_card_desc: "Đăng ký để được tiếp cận sớm",
          coming_soon: "Sắp Ra Mắt",
          get_alpha_access_title: "Nhận Quyền Truy Cập Alpha",
          get_alpha_access_desc: "Hãy là người đầu tiên thử nghiệm ứng dụng của Meteor!",
          ended: "Đã Kết Thúc",
          staked: "Đã Đặt Cược",
          delayed: "Đã Trì Hoãn",
        },
        meme_season_7: {
          tab_title: {
            INFO: "Thông tin",
            STAKE_VOTE: "Stake & Vote",
            UNSTAKE: "Unstake",
            MYREWARDS: "Phần thưởng của tôi",
          },
          phase_1: {
            page_title: "Bỏ Phiếu xRef",
            title_1: "Bỏ Phiếu xRef",
            title_2: "(Giai đoạn 1 - Mùa Meme 10)",
            description:
              "Tham gia Cuộc thi MEME Ref và nhận phần thưởng để hỗ trợ cộng đồng Meteor và $GEAR!",
            tab_content: {
              info: {
                campaign_info: {
                  title: "Thông tin Chiến dịch",
                  voting_period: "Thời gian Bỏ phiếu",
                  voting_period_tooltip:
                    "Nếu bạn đã bỏ phiếu trong mùa trước, bạn không cần phải hủy bỏ để bỏ phiếu lại, phiếu bầu của bạn sẽ được tính qua Meteor hoặc Ref bất kể điều gì",
                  snapshot_period: "Ảnh chụp nhanh",
                  snapshot_period_desc:
                    "{snapshot_period} (Unstake trước thời gian này không được tính)",
                  unstaking_available: "Unstake",
                  unstaking_available_desc: "Có sẵn vào {unstaking_available}",
                  day_lock: "Rút staking sẽ có sẵn từ ngày 1 đến ngày 6 UTC 00:00 tháng sau.",
                  minimum_stake: "Cọc Tối Thiểu",
                  minimum_stake_desc: "Cọc ít nhất {amount} xRef để tham gia",
                },
                participation_info: {
                  title: "Phần thưởng Tham gia",
                  advanced_contract: "1x Hợp đồng Nâng cao cho ít nhất 1 phiếu bầu",
                  raffle_ticket: "Vé Rút thăm cho mỗi xRef/GEAR bổ sung được bầu",
                },
                rewards_info: {
                  title: "Phần thưởng Rút thăm Tiềm năng",
                  gear: "Lên đến $3,000 trong $GEAR sẽ được rút thăm dựa trên các cột mốc đạt được.",
                  contract:
                    "Lên đến 6,000 hợp đồng nâng cao và 500 hợp đồng chuyên gia dựa trên các cột mốc.",
                  token:
                    "Lên đến $50K Phần thưởng Mùa Meme dựa trên sức mạnh bỏ phiếu của cộng đồng",
                },
                milestone_info: {
                  title: "Phần thưởng Cột mốc",
                  description:
                    "Mỗi cột mốc thêm nhiều vật phẩm vào quỹ rút thăm. Mỗi vé rút thăm cho bạn cơ hội giành được phần thưởng.",
                },
              },
              unstake: {
                coming_soon: "Unstake sẽ có sẵn vào {unstaking_available}",
                unstake_period: "Vui lòng lưu ý rằng sẽ có khoảng thời gian khóa ~{days} ngày",
                description_unstaking:
                  "Bạn đang unstake {balanceUnstaking} xRef Token. Thường mất khoảng ~{days} ngày để hoàn thành",
              },
              myreward: {
                title: "Phần thưởng Rút thăm",
                coming_soon: "Kết quả rút thăm sẽ được công bố vào {raffle_reward}",
                button_claimed: "Đã nhận",
                button_claimable: "Nhận",
                button_not_qualified: "Không đủ điều kiện",
              },
            },
          },
          phase_2: {
            page_title: "Bỏ Phiếu xRef",
            title_1: "Bỏ Phiếu xRef",
            title_2: "(Giai đoạn 2 - Mùa Meme 10)",
            description:
              "Tham gia Cuộc thi MEME Ref và nhận phần thưởng để hỗ trợ cộng đồng Meteor và $GEAR!",
            tab_content: {
              info: {
                campaign_info: {
                  title: "Thông tin Chiến dịch",
                  voting_period: "Thời gian Bỏ phiếu",
                  snapshot_period: "Ảnh chụp nhanh",
                  snapshot_period_desc:
                    "{snapshot_period} (Unstake trước thời gian này không được tính)",
                  unstaking_available: "Unstake",
                  unstaking_available_desc: "Có sẵn vào {unstaking_available}",
                },
                participation_info: {
                  title: "Phần thưởng Tham gia",
                  advanced_contract: "1x Hợp đồng Nâng cao cho ít nhất 1 phiếu bầu",
                  raffle_ticket: "Vé Rút thăm cho mỗi xRef/GEAR bổ sung được bầu",
                },
                rewards_info: {
                  title: "Phần thưởng Rút thăm Tiềm năng",
                  gear: "Lên đến $3,000 trong $GEAR sẽ được rút thăm dựa trên các cột mốc đạt được.",
                  contract:
                    "Lên đến 6,000 hợp đồng nâng cao và 500 hợp đồng chuyên gia dựa trên các cột mốc.",
                  token:
                    "Lên đến $50K Phần thưởng Mùa Meme dựa trên sức mạnh bỏ phiếu của cộng đồng",
                },
                milestone_info: {
                  title: "Phần thưởng Cột mốc",
                  description:
                    "Mỗi cột mốc thêm nhiều vật phẩm vào quỹ rút thăm. Mỗi vé rút thăm cho bạn cơ hội giành được phần thưởng.",
                },
              },
              stake: {
                stake_period: "Stake ít nhất {stake_amount} GEAR để nhận hợp đồng nâng cao.",
              },
              unstake: {
                coming_soon: "Unstake sẽ có sẵn vào {unstaking_available}",
                unstake_period: "Vui lòng lưu ý rằng sẽ có khoảng thời gian khóa ~{days} ngày",
                description_unstaking:
                  "Bạn đang unstake {balanceUnstaking} GEAR Token. Thường mất khoảng ~{days} ngày để hoàn thành",
              },
              myreward: {
                title: "Phần thưởng Rút thăm",
                coming_soon: "Kết quả rút thăm sẽ được công bố vào {raffle_reward}",
                button_claimed: "Đã nhận",
                button_claimable: "Nhận",
                button_not_qualified: "Không đủ điều kiện",
              },
            },
          },
        },
        section_challenge: {
          title: "Thử Thách Cho Người Mới",
          description:
            "Nâng cấp và cải thiện thiết lập của bạn để kiếm phần thưởng và nâng cao trải nghiệm chơi game của bạn!",
          button_start: "Bắt đầu",
          label_challenge_list: "Danh sách Thử Thách",
          button_remind_to_harvest: "Nhắc nhở Thu Hoạch",
          button_claim: "Yêu cầu",
          label_tier: "Cấp độ",
          label_basic_info: "Thông Tin Cơ Bản",
          label_friend_quests: "Nhiệm vụ Bạn Bè",
          label_last_7_days_contribution: "Đóng góp 7 Ngày Cuối",
          label_filter_by_status: "Lọc theo Trạng Thái",
          label_active: "Hoạt động",
          label_inactive: "Không hoạt động",
          text_inactive: "Người chơi chưa khởi tạo mùa thu hoạch",
          button_filter: "Lọc",
          label_no_friend_yet: "Chưa Có Bạn Bè",
          label_refer_and_earn_reward: "Giới thiệu & Nhận Thưởng",
          text_share: "Nhấn vào nút chia sẻ phía trên và bắt đầu mời bạn bè!",
          label_refer_and_earn_desc: "Giới thiệu bạn bè để nhận",
          label_refer_and_earn_desc_2: "20% phần thưởng $MOON",
          label_refer_and_earn_desc_3: "và một",
          label_refer_and_earn_desc_4: "Hợp Đồng Cơ Bản",
          button_verify_telegram: "Xác Minh Tài Khoản Telegram Ngay",
          label_friend_list: "Danh Sách Bạn Bè",
          button_remind_to_harvest_all: "Nhắc nhở Thu Hoạch Tất cả",
          button_click_to_refresh: "Nhấn vào danh sách bạn bè để xem thêm chi tiết",
          label_tier_level: "Cấp Độ Tier",
          label_container_level: "Cấp Độ Container",
          label_lab_level: "Cấp Độ Phòng Lab",
        },
        section_profile: {
          label_player_tier: "Cấp độ người chơi",
          label_total_earned: "Tổng số kiếm được",
        },
        section_missions: {
          text_upgrade_tier_not_tier_3:
            "Nâng cấp lên Tier 3 để mở khóa các nhiệm vụ với phần thưởng hấp dẫn. Sắp ra mắt!",
          text_upgrade_tier_tier_3:
            "Hãy kiên nhẫn và sẵn sàng - chúng tôi sẽ ra mắt các nhiệm vụ sớm!",
          button_upgrade_now: "Nâng cấp ngay",
          coming_soon: "SẮP RA MẮT",
        },
        section_home: {
          missions: "Nhiệm vụ",
          coming_soon: "Sắp ra mắt",
          title:
            "Kiếm hợp đồng, tuyển dụng Tinkers và tăng phần thưởng. Tham gia giao dịch và nhận token để có cơ hội giành giải thưởng tiền mặt!",
          flash_missions: "Nhiệm vụ Nhanh",
          streak_missions: "Nhiệm vụ Liên tục",
          flash_mission_list: "Danh sách Nhiệm vụ Nhanh",
          streak_mission_list: "Danh sách Nhiệm vụ Liên tục",
          prize_pool: "Quỹ Giải thưởng",
          newbie_title: "Thử thách Người mới",
          newbie_subtitle: "Học & Nâng cấp",
          phase1_title: "Bỏ phiếu với xRef",
          phase1_subtitle: "Giai đoạn 1 - Mùa Meme 10",
          phase2_title: "Bỏ phiếu với $GEAR",
          phase2_subtitle: "Giai đoạn 2 - Mùa Meme 10",
          streak: "Liên tục",
        },
        section_coming_soon: {
          title_xref: "Bỏ phiếu với xRef",
          title_gear: "Bỏ phiếu với $GEAR",
          subtitle_xref: "Bỏ phiếu với xRef (Giai đoạn 1 - Mùa Meme 10)",
          subtitle_gear: "Bỏ phiếu với $GEAR (Giai đoạn 2 - Mùa Meme 10)",
          coming_soon: "Sắp ra mắt",
          title: "Bỏ phiếu với xRef (Giai đoạn 1 - Mùa Meme 10)",
          days: "Ngày",
          hours: "Giờ",
          minutes: "Phút",
          button_back: "Quay lại",
        },
        mission_content: {
          [EMissionSubType.SWAP_TO]: {
            title: "Giao dịch Memecoin",
            description:
              "Đổi hơn 5 đô la trong memecoin để kiếm được hợp đồng cơ bản. Duy trì chuỗi ngày của bạn để tăng cấp nhanh hơn và mở khóa phần thưởng lớn hơn với các đợt giảm giá token! Bỏ lỡ một ngày, chuỗi ngày và tổng khối lượng giao dịch của bạn sẽ được đặt lại vào {time} (0.00 UTC).",
            total_count: "Tổng khối lượng: ${count}",
          },
          [EMissionSubType.BRIDGE_FROM]: {
            title: "Mã thông báo cầu nối",
            description:
              "Sử dụng Meteor Bridge để dễ dàng di chuyển token qua các blockchain khác nhau. Chuyển ít nhất 25 đô la (theo cả hai hướng) để kiếm được hợp đồng nâng cao. Duy trì chuỗi ngày của bạn để tăng cấp nhanh hơn và mở khóa phần thưởng lớn hơn với các đợt giảm token! Bỏ lỡ một ngày và chuỗi ngày của bạn cùng tổng khối lượng giao dịch sẽ được thiết lập lại lúc {time} (0.00 UTC)",
            total_count: "Tổng khối lượng: ${count}",
          },
          [EMissionSubType.HM_TIME_TRAVEL]: {
            title: "Tinker du hành thời gian",
            description:
              "Du hành thời gian thành công bất kỳ Tinker nào để kiếm được hợp đồng cơ bản. Duy trì chuỗi ngày của bạn để lên cấp nhanh hơn và đủ điều kiện nhận phần thưởng lớn hơn với các lần thả token! Bỏ lỡ một ngày và chuỗi của bạn sẽ được thiết lập lại vào lúc {time} (0.00 UTC)",
            total_count: "Tổng khối lượng: {count}",
          },
        },
        section_mission_detail: {
          total_trade: "Tổng Giao dịch",
          day_streak: "Chuỗi Ngày",
          mission_details: "Chi tiết Nhiệm vụ",
          eligible_tokens: "Token đủ điều kiện",
          today_progress: "Tiến độ Hôm nay",
          mission_accomplished: "Nhiệm vụ Hoàn thành",
          continue_streak: "Tiếp tục Chuỗi của Bạn vào Ngày mai!",
          live: "sống",
          token_drop_rewards: "Phần thưởng Token Drop",
          usdc_giveaway: "Token Drop USDC trị giá $25k Đang Diễn Ra",
          streak_mission_list: "Danh sách nhiệm vụ Streak",
          reward: "phần thưởng",
          btn_letsgo: "Đi thôi",
          btn_swap: "Hoán đổi ngay",
          btn_bridge: "Cầu ngay",
          btn_time_travel: "Du hành thời gian ngay",
          day1: "T2",
          day2: "T3",
          day3: "T4",
          day4: "T5",
          day5: "T6",
          day6: "T7",
          day7: "CN",
          view_info: "Xem Thông Tin",
          see_more: "Xem thêm",
        },
      },
      tab_tinker: {
        section_production_rate: {
          title: "Tỷ lệ sản xuất của Tinker",
          label_moon_per_hour: "$MOON/GIỜ",
          button_recruit: "Tuyển Dụng Tinker",
        },
        section_active_tinkers: {
          title: "TINKER HOẠT ĐỘNG CỦA TÔI",
          subtitle: "{count} Tinker",
          subtitleExtra: "Sức chứa phòng thí nghiệm",
          button_fusion: "Du Hành Thời Gian",
          label_the: "The",
          label_new_production_rate: "Tỷ Lệ Sản Xuất Mới",
          label_moon_per_hour: "$MOON/Giờ",
          tooltip_fusion:
            "Nâng cấp Tinker của bạn bằng cách gửi chúng vào một cuộc phiêu lưu du hành thời gian! Mỗi Tinker có tỷ lệ thành công riêng, và bạn có thể đốt GEAR để tăng cơ hội của chúng. Tuy nhiên, nếu Tinker của bạn thất bại, bạn sẽ mất chúng.",
        },
        section_union_contracts: {
          title: "HỢP ĐỒNG LIÊN ĐOÀN",
          subtitle: "Tổng cộng {count} Hợp đồng",
        },
        toast: {
          recruiting_tinker: "Đang tuyển dụng Tinker(s)",
          recruit_tinker_failed: "Tuyển dụng Tinker thất bại. Vui lòng thử lại.",
        },
        modal: {
          no_new_mph: {
            title:
              "Người thợ mới được tuyển không cải thiện tỷ lệ sản xuất chung vì đội hình hiện tại của bạn hiệu quả hơn, dẫn đến không tăng MPH. Cân nhắc nâng cấp phòng thí nghiệm của bạn để cải thiện tỷ lệ sản xuất.",
          },
          tinker_fusion: {
            title: "Du Hành Thời Gian",
            description: "Nâng cấp tinker của bạn lên một cấp độ hoàn toàn mới!",
            label_how_many: "Bao nhiêu",
            label_to_fusion: "để du hành thời gian",
            label_burn: "Đốt",
            label_to_increase_success_rate: "để tăng tỷ lệ thành công",
            label_total_moon_cost: "Tổng chi phí $MOON",
            label_total_gear_cost: "Tổng chi phí GEAR",
            label_balance: "Số dư",
            label_success_rate: "Tỷ Lệ Thành Công",
            label_info: "Nếu du hành thời gian thất bại, Tinker của bạn sẽ bị mất.",
            button_start_fusion: "Bắt Đầu Du Hành Thời Gian",
            warning_not_enough_gear: "Bạn không có đủ GEAR.",
            button_buy_now: "Mua Ngay",
          },
          tinker_production_rate: {
            title: "Tổng quan về sản xuất Tinker",
            subtitle:
              "Phòng thí nghiệm của bạn sẽ tự động triển khai Tinker hiệu quả nhất trước. {upgrade} để tăng năng lực hoặc sử dụng {relics} để tăng tốc độ sản xuất.",
            upgrade: "Nâng cấp phòng thí nghiệm của bạn",
            relics: "Relics",
            desc1: "Thực tập sinh đã tuyển dụng :",
            desc2: "Thực tập sinh đã triển khai :",
            desc3: "Tỷ lệ sản xuất đang hoạt động :",
            totalTinkers: "Tổng số tinker : ",
            labCapacity: "Năng lực phòng thí nghiệm : ",
            relic_boost: "Tăng cường Relic",
            production_rate: "Tỷ lệ sản xuất",
          },
        },
      },
      tab_upgrade: {
        section_lab_stats: {
          title: "THỐNG KÊ PHÒNG THÍ NGHIỆM",
          label_container: "Container",
          label_moonlight_storage: "Bộ nhớ Moonlight",
          label_lab_capacity: "Sức chứa phòng thí nghiệm",
          label_maximum_tinker: "Tinker tối đa",
          button_upgrade: "Nâng cấp",
        },
        section_experiments: {
          title: "THÍ NGHIỆM GEAR",
          label_relics: "Di tích",
          label_moon_exchange: "Trao đổi $MOON",
          label_boost: "Tăng cường",
          label_left: "Trái",
          text_countdown_info: "Giao dịch $MOON còn có sẵn trong {countdown} ngày nữa.",
        },
        subpage_gear_relics: {
          title: "Di tích GEAR",
          label_unlock_relic_slot: "Mở khóa Khe Di tích",
          text_unlock_relic_slot: "để mở khóa khe di tích mới",
          label_current_balance: "Số dư hiện tại",
          button_buy_gear: "Mua thiết bị",
          section_boost_rate: {
            label_boost_rate: "Tỷ lệ Tăng cường",
            label_equipped_relics: "Di tích Đã trang bị",
          },
          section_forge_relic: {
            label_forge_relic: "Rèn Di tích",
            label_burn_gear_1: "Đốt",
            label_burn_gear_2: "để nhận di tích mới",
            label_buy_sell_relic: "Mua/Bán Di vật",
            text_buy_sell_relic: "Lấy NFT Di vật của bạn qua Marketplace",
            label_harvest_moon_relic: "Di vật Harvest Moon",
            text_harvest_moon_relic: "Nhận 10% Boost",
            label_union_contract_relic: "Di vật Hợp đồng Liên minh",
            text_union_contract_relic: "Nhận 50% Boost",
            label_gear_relic: "Di vật Gear",
            label_other_relic: "Di tích Khác",
            label_gear_relic_on_paras: "Di tích Trang bị trên Paras",
            label_gear_relic_on_tradeport: "Di tích Trang bị trên Tradeport",
            text_gear_relic: "Nhận 25% ~ 250% Boost",
          },
          section_relics: {
            title: "Di tích Có sẵn",
            label_drop_rate: "Tỷ lệ rơi",
            label_rarity: "Độ hiếm",
            label_boost_rate: "Tỷ lệ Tăng cường",
            label_total: "Tổng cộng",
            label_unequip: "Tháo bỏ",
            label_unequip_cooldown: "Thời gian chờ Tháo bỏ",
            text_maturity: "Bạn chỉ có thể tháo bỏ trang bị đã trang bị sau {days} ngày",
            warning_no_relics:
              "Bạn không có di tích nào. Hãy tạo một cái ngay bây giờ hoặc mua trên Paras.",
          },
        },
        subpage_moon_exchange: {
          title: "Trao đổi MOON",
          label_select_asset_to_exchange_with: "Chọn tài sản để trao đổi",
          label_conversion_rate: "Tỷ lệ chuyển đổi",
          label_click_to_start_convert: "Nhấp vào danh sách để bắt đầu chuyển đổi",
          section_exchange: {
            title: "TRAO ĐỔI",
            label_asset_to_receive: "Tài sản nhận được",
            label_asset_to_exchange_with: "Tài sản để trao đổi",
            label_you_are_going_to_convert: "Bạn sẽ chuyển đổi",
            label_to: "thành",
            button_conversion_rate: "Tỷ lệ chuyển đổi",
            button_convert: "Chuyển đổi",
          },
        },
        toast: {
          exchange_success: "Đã chuyển đổi thành công {from} thành {to}",
          forging_relic: "Đang rèn",
          forging_relic_success: "Rèn thành công",
          unlocking_relic_slot: "Đang mở khóa",
          unlocking_relic_slot_success: "Mở khóa khe di tích thành công",
          equip_relic_success: "Trang bị thành công",
          unequip_relic_success: "Tháo bỏ thành công",
          upgrade_container_success: "Nâng cấp container thành công",
          upgrade_lab_success: "Nâng cấp lab thành công",
          sunset_gear: "GEAR staking sẽ kết thúc",
          button_unstake: "Rút cổ phần ở đây",
          button_forge: "Rèn ở đây",
          button_close: "Đóng",
          button_equip: "Trang bị",
          button_unlock: "Mở khóa Ngay",
        },
      },
      relic_rarity: {
        [EHarvestMoon_RelicRarity.common]: "Bình thường",
        [EHarvestMoon_RelicRarity.uncommon]: "Không phổ biến",
        [EHarvestMoon_RelicRarity.rare]: "Hiếm",
        [EHarvestMoon_RelicRarity.legendary]: "Huyền thoại",
      },
      tier: {
        tier_name_1: "Cấp độ người chơi: 1",
        tier_name_2: "Cấp độ người chơi: 2",
        tier_name_3: "Cấp độ người chơi: 3",
        tier_description_1:
          "Đây là nơi hành trình của bạn bắt đầu. Tài khoản của bạn sẽ được bổ sung một giao dịch không tốn gas mỗi ngày",
        tier_description_2:
          "Chúc mừng bạn đã bước vào thế giới crypto! Khám phá những điều cơ bản trong crypto và tăng tốc chuyến đi MOON của bạn",
        tier_description_3:
          "Đào sâu hơn vào thế giới DeFi và hệ sinh thái NEAR để nâng cao trải nghiệm và thăng cấp của bạn.",
        benefits: {
          one_gas_free_transaction_everyday: "1 giao dịch miễn phí hàng ngày",
          eligible_for_basic_contracts_during_harvest_lotteries:
            "Đủ điều kiện cho các hợp đồng cơ bản trong quá trình thu hoạch ngẫu nhiễn ",
          harvest_anytime_without_waiting_period: "Thu hoạch bất cứ lúc nào mà không cần chờ đợi",
          chance_to_get_advanced_contract_during_harvest:
            "Cơ hội nhận được hợp đồng nâng cao trong quá trình thu hoạch",
          chance_to_get_expert_contract_during_harvest:
            "Cơ hội nhận được hợp đồng chuyên gia trong quá trình thu hoạch",
          unlock_missions_feature: "Mở khóa tính năng nhiệm vụ",
          automated_harvest: "Thu hoạch tự động",
          automated_recruit_when_you_get_contract_from_harvesting:
            "Tuyển dụng tự động (khi bạn nhận được Hợp đồng Liên Đoàn từ việc thu hoạch)",
        },
        conditions: {
          hold_3_near_in_your_wallet_description: "Giữ 3 NEAR trong ví của bạn",
          hold_3_near_in_your_wallet_button: "Nạp",
          set_a_password_for_your_wallet_description: "Đặt mật khẩu cho ví của bạn",
          set_a_password_for_your_wallet_button: "Đặt Mật khẩu ngay",
          backup_your_seedphrase_description: "Sao lưu cụm từ hạt giống của bạn",
          backup_your_seedphrase_button: "Sao lưu Ngay",
          stake_5_near_in_meteor_validator: "Stake",
          stake_5_near_in_meteor_validator_description: "Stake 5 NEAR trong Validator Meteor",
        },
      },
      wallet_link: {
        wallet_link: "Liên Kết Ví",
        pick_wallet_to_link: "Chọn ví bạn muốn liên kết",
        link_selected_account: "Liên Kết Tài Khoản Đã Chọn",
        linked_to: "Đã liên kết với",
        button_back_to_home: "Trở Lại Ví",
        modal: {
          title: "Thời Gian Khóa",
          description:
            "Xin lưu ý rằng bạn chỉ có thể thay đổi ví liên kết của mình sau 72 giờ kể từ lần thay đổi cuối cùng.",
          button_confirm: "Xác Nhận Liên Kết Tài Khoản",
          button_back: "Trở Lại",
        },
      },
      wallet_link_select_primary: {
        primary_wallet_explanation:
          "Tất cả thu nhập từ giới thiệu đều được gửi đến ví chính của bạn. Ví này cũng có lợi thế không phải trả phí giao dịch.",
        confirm_primary_wallet: "XÁC NHẬN VÍ CHÍNH",
        primary_wallet: "VÍ CHÍNH",
      },
      new_onboarding: {
        label_player_name: "TÊN NGƯỜI CHƠI",
        label_creating_account: "TẠO TÀI KHOẢN",
        label_linking_telegram: "LIÊN KẾT VỚI TELEGRAM",
        label_not_enough_balance: "KHÔNG ĐỦ SỐ DƯ",
        label_adding_access_key: "THÊM KHÓA TRUY CẬP",
        label_initializing_account: "KHỞI TẠO TÀI KHOẢN",
        text_disclaimer_starting: "Đảm bảo ví của bạn có {startingFee} NEAR cho phí mạng lưới",
        text_disclaimer_consumed:
          "Một khoản phí nhỏ của {consumedNetworkFee} NEAR sẽ được tiêu dùng cho phí mạng và lưu trữ",
        button_create_account: "TẠO TÀI KHOẢN",
        button_next: "TIẾP THEO",
        button_start: "BẮT ĐẦU",
        modal: {
          deposit: {
            title: "Sẵn sàng để MOON?",
            description:
              "Hãy đảm bảo rằng bạn đã xác minh Telegram của mình hoặc có tài khoản có NEAR để bắt đầu",
            text_your_telegram_has_been_linked: "Telegram của bạn đã có một ví chính",
            label_or: "hoặc",
            button_verify_telegram_account: "Xác minh tài khoản Telegram",
            button_deposit_near: "Gửi tiền {startingFeeDisplayed} NEAR",
          },
          insufficient_balance: {
            title: "🔥 Ooops, Không đủ NEAR cho Gas",
            description_1: "Hầu hết các giao dịch tốn ít hơn 0,01 NEAR.",
            description_2:
              "Tuy nhiên, giao thức NEAR sử dụng ước lượng gas bi quan để đối phó với tình huống tồi tệ nhất trong thời gian cao điểm.",
            description_3: "Hãy đảm bảo bạn có",
            description_4: "ít nhất 0,2 NEAR",
            description_5: "trong ví của bạn để tận hưởng trải nghiệm mượt mà.",
            button_top_up: "Nhận Thêm Near Ngay Bây Giờ",
          },
        },
      },
      maintenance: {
        title: "Đang Cập Nhật Trò Chơi",
        description:
          "Harvest Moon tạm thời bị tạm dừng để nâng cấp hợp đồng giúp bạn có trải nghiệm mượt mà hơn.",
        footer: "Chúng tôi sẽ trở lại sau khoảng 4 giờ—cảm ơn sự kiên nhẫn của bạn!",
        label_migration_notice: "Thông báo cập nhật",
        button_learn_more: "Tìm hiểu thêm",
      },
      social_onboarding: {
        join_telegram: "THAM GIA KÊNH TELEGRAM CỦA CHÚNG TÔI",
        join_twitter: "THEO DÕI METEOR TRÊN X",
        complete_to_start: "Hoàn thành các bước dưới đây để bắt đầu",
        ready_to_start: "Sẵn sàng để bắt đầu!",
        start: "BẮT ĐẦU",
      },
      landing: {
        title: "BẠN KHÔNG NẰM TRONG DANH SÁCH TRẮNG",
        button_apply_now: "NỘP ĐƠN NGAY",
        button_back_to_meteor: "QUAY LẠI VỚI METEOR",
      },
      main: {
        text_wallet_address: "ĐỊA CHỈ VÍ",
        text_total_moon_token: "Tổng Số Token $MOON",
        text_max: "TỐI ĐA",
        text_per_hour: "$MOON/GIỜ",
        text_harvesting: "THU HOẠCH",
        text_full_moon: "TRĂNG TRÒN",
        text_moon_balance: "SỐ DƯ",
        warning_connect_telegram:
          "Kết nối tài khoản Telegram của bạn để nhận 10 giao dịch miễn phí gas mỗi ngày!",
        warning_save_credentials:
          "Vui lòng lưu lại cụm từ hạt giống và khóa riêng của bạn để tránh mất dữ liệu của bạn!",
        warning_storage_full: "KHÔNG GIAN LƯU TRỮ ĐẦY",
        button_harvest: "Thu hoạch",
        button_next_harvest: "THU HOẠCH TIẾP THEO",
        button_harvest_moon: "THU HOẠCH $MOON",
        button_to_wallet: "ĐẾN VÍ",
      },
      onboarding: {
        main: {
          title: "KHỞI ĐỘNG",
          description:
            "Chương mới của bạn trong Vũ trụ Ví Meteor đang chờ đợi! Hoàn thành một vài bước đơn giản để bắt đầu cuộc phiêu lưu của bạn.",
          label_link_telegram: "LIÊN KẾT TÀI KHOẢN TELEGRAM",
          description_link_telegram:
            "Liên kết ví với telegram để có trải nghiệm chơi game không tốn phí gas!",
          label_add_access_key: "THÊM KHÓA TRUY CẬP",
          description_add_access_key:
            "Thêm quyền (truy cập gọi chức năng) vào tài khoản của bạn cho trải nghiệm Harvest Moon.",
          label_initialize_account: "KHỞI TẠO TÀI KHOẢN",
          description_initialize_account:
            "Khởi tạo tài khoản trò chơi của bạn với một Tinker miễn phí.",
          label_go_to_moon: "ĐI ĐẾN MẶT TRĂNG",
          description_go_to_moon:
            "Hành trình của bạn đến mặt trăng đã được chuẩn bị; bắt đầu thu hoạch ngay bây giờ.",
          message_linked: "Liên kết với",
          message_linked_no_tg: "Ví được liên kết với một tài khoản Telegram khác",
          message_not_linked: "Tài khoản Telegram không được liên kết",
          message_tg_linked: "Telegram được liên kết với ví này",
          message_gas_free: "Bạn đủ điều kiện để chơi mà không cần trả phí gas",
          message_network_fee:
            "Một khoản phí mạng nhỏ được yêu cầu cho tài khoản không được xác minh bằng Telegram",
          message_deposit_fee: "Điều này yêu cầu một khoản gửi tiền lưu trữ NEAR 0,003",
          warning_wallet_already_linked:
            "Ví đã được liên kết với một tài khoản Telegram khác. Vui lòng sử dụng ví khác.",
          button_link: "LIÊN KẾT NGAY",
          button_add: "THÊM NGAY",
          button_init: "BẮT ĐẦU NGAY",
          button_go: "ĐI NGAY",
        },
        warning: {
          title: "LIÊN KẾT VÍ CỦA BẠN VỚI TELEGRAM",
          text_basic_union_contract: "hợp đồng liên minh cơ bản",
          text_gas_free: "Miễn phí gas",
          text_transaction: "giao dịch",
          text_new_access_key_required:
            "Một khóa truy cập mới là cần thiết cho Harvest Moon đã cập nhật",
          message:
            "Bằng cách liên kết ví của bạn ({wallet_id}) với tài khoản Telegram ({username}), phần thưởng giới thiệu tích lũy của bạn sẽ được yêu cầu. Liên kết với Telegram sẽ mang lại cho bạn những lợi ích dưới đây:",
          warning: "Phần thưởng không thể được chuyển sau khi đã yêu cầu",
          button_proceed: "Tiếp tục",
          button_cancel: "Hủy",
        },
        step_1: {
          message:
            "Chào mừng bạn đến với Harvest Moon—chương mới của bạn trong vũ trụ Meteor Wallet đang chờ đợi! Bạn đã sẵn sàng bắt đầu cuộc hành trình này và nhận phần thưởng của bạn chưa?",
          button_continue: "NHẤN ĐỂ TIẾP TỤC",
        },
        step_2: {
          message_not_verified:
            "Hãy thiết lập tài khoản của bạn, nhanh chóng và dễ dàng—chỉ mất 30 giây. Bạn đã sẵn sàng chưa?",
          message_verified:
            "Đầu tiên, chúng tôi sẽ nhanh chóng thiết lập tài khoản của bạn—chỉ mất 30 giây. Mà không cần liên kết với Telegram, có một khoản phí mạng nhỏ (khoảng 0,003N) cho các giao dịch. Sẵn sàng bắt đầu không?",
          option_continue: "Dĩ nhiên, hãy bắt đầu",
          option_cancel: "Không, đưa tôi trở lại Meteor Wallet",
        },
        step_3: {
          message:
            "Để bắt đầu, chúng tôi sẽ thêm một khóa truy cập chức năng vào tài khoản của bạn, cho phép tương tác mượt mà với hợp đồng Harvest Moon.",
          button_continue: "Hãy làm điều đó",
          button_try_again: "Thử lại",
        },
        step_4: {
          message_setting_up_account:
            "Tuyệt vời, tài khoản của bạn đang được thiết lập. Đợi chút khi chúng tôi chuẩn bị mọi thứ!",
          message_not_enough_balance:
            "Bạn không có đủ số dư để khởi tạo tài khoản. Vui lòng nạp tiền vào tài khoản của bạn bằng NEAR và thử lại.",
          option_try_again: "Thử lại",
          option_back: "Quay lại",
        },
        step_5: {
          message: "Mọi thứ đã sẵn sàng! Hãy đi đến MẶT TRĂNG!",
          button_ok: "Được rồi",
        },
      },
      tab: {
        title: {
          harvest: "THU HOẠCH",
          tinker: "TINKER",
          upgrade: "NÂNG CẤP",
          mission: "NHIỆM VỤ",
        },
        lumen_lab: {
          title_lab_stats: "THỐNG KÊ LAB",
          label_container: "CONTAINER",
          text_upgrade_container:
            "SỬ DỤNG TOKEN $MOON ĐỂ NÂNG CẤP CONTAINER CỦA BẠN, ÍT PHẢI VÀO THU HOẠCH HƠN",
          label_lab_capacity: "SỨC CHỨA LAB",
          text_upgrade_lab:
            "SỬ DỤNG TOKEN $MOON ĐỂ NÂNG CẤP SỨC CHỨA LAB CỦA BẠN ĐỂ TUYỂN DỤNG THÊM NHIỀU TINKER",
          text_hour: "GIỜ",
          text_moonlight_storage: "LƯU TRỮ ÁNH TRĂNG",
        },
        tinker_recruitment: {
          text_moon_per_hour: "$MOON/GIỜ",
          text_active_tinkers: "TINKERS ĐANG HOẠT ĐỘNG",
          text_total_tinkers: "TỔNG SỐ TINKERS",
          text_lab_capacity: "SỨC CHỨA LAB",
          text_available_union_contracts: "Hợp đồng liên minh có sẵn",
          warning_min_tinker_count: "Tuyển ít nhất 1 Tinker",
          button_recruit: "TUYỂN DỤNG",
        },
        portal_referral: {
          text_coming_soon: "Chi tiết về các bạn của bạn sẽ được hiển thị ở đây sớm.",
          text_my_frens: "BẠN CỦA TÔI",
          text_moon_earned: "$MOON ĐÃ KIẾM ĐƯỢC",
          warning_no_telegram: "Kết nối tài khoản Telegram của bạn để bắt đầu",
          warning_link_telegram:
            "Liên kết ví của bạn đến Telegram để truy cập các liên kết giới thiệu và bắt đầu kiếm phần thưởng",
          button_share_on_tg: "CHIA SẺ TRÊN TG",
          button_share_on_x: "CHIA SẺ TRÊN X",
          button_copy_referral_link: "SAO CHÉP LIÊN KẾT GIỚI THIỆU",
          button_link_to_telegram: "Liên kết đến Telegram",
          content_share_on_x: `Thu hoạch MOON? Đây là cách đơn giản nhất để chơi & kiếm tiền trong thế giới crypto - từ @MeteorWallet

🚀 Kiếm: $MOON = Meteor #airdrops

Sẵn sàng tham gia?
👇3 lần nhấp đầu tiên giành được vé vàng cho Beta`,
          content_share_on_tg: `Thu hoạch MOON? Đây là cách đơn giản nhất để chơi & kiếm tiền trong thế giới crypto - từ Meteor Wallet

🚀 Kiếm: $MOON = Meteor #airdrops

Sẵn sàng tham gia?
👇3 lần nhấp đầu tiên giành được vé vàng cho Beta`,
        },
        setting: {
          warning_link_telegram_success: "Tài khoản Telegram đã được liên kết thành công",
          button_link_to_telegram: "LIÊN KẾT VÍ VỚI TELEGRAM",
          button_give_feedback: "GỬI PHẢN HỒI",
          button_view_secret_phrase: "XEM CỤM TỪ BÍ MẬT",
          button_export_private_key: "XUẤT KHÓA RIÊNG",
          button_quit_game: "THOÁT TRÒ CHƠI",
        },
      },
      modal: {
        unopen_reward: {
          title: "Chúc mừng!",
          description: "Bạn đã nhận được",
          button_cool: "Tuyệt!",
          reward_id: "ID Phần Thưởng",
          from: "Từ",
        },
        link_to_telegram: {
          title: "LIÊN KẾT ĐẾN TELEGRAM",
          description:
            "Nhận cập nhật trò chơi trực tiếp và trở thành đủ điều kiện cho chương trình giới thiệu của chúng tôi",
          text_dont_show_again: "Không hiển thị lại",
          button_link_wallet: "LIÊN KẾT VÍ",
        },
        upgrade: {
          container: {
            title: "NÂNG CẤP BỘ NHỚ",
            description:
              "SỬ DỤNG TOKEN $MOON ĐỂ NÂNG CẤP CONTAINER CỦA BẠN CHO THỜI GIAN THU HOẠCH LÂU HƠN",
          },
          lab: {
            title: "NÂNG CẤP LAB",
            description: "SỬ DỤNG TOKEN $MOON ĐỂ NÂNG CẤP LAB CỦA BẠN ĐỂ TUYỂN DỤNG THÊM TINKERS",
          },
          label_current_level: "CẤP ĐỘ HIỆN TẠI",
          label_upgrade_level: "CẤP ĐỘ NÂNG CẤP",
          text_moon: "$MOON",
          button_upgrade: "NÂNG CẤP",
        },
        maintenance: {
          title: "THÔNG BÁO BẢO DƯỠNG",
          description:
            "Chúng tôi đã di chuyển thành công sang hợp đồng thông minh mới để nâng cao trải nghiệm chơi game của bạn. Nếu số dư Tinkers hoặc $MOON của bạn không đúng, hãy cho chúng tôi biết.",
          button_report_issue: "Báo cáo vấn đề",
        },
        leaderboard: {
          title: "Bảng Xếp Hạng",
          loading: "Đang lấy dữ liệu bảng xếp hạng",
          text_rank: "Hạng",
          text_player_name: "Tên Người Chơi",
          text_moon_hr_rate: "$MOON/Giờ",
          text_total_players: "Tổng cộng {count} Người Chơi",
          button_close: "ĐÓNG",
          label_boost: "Tăng cường",
          button_rank_higher: "Mẹo để xếp hạng cao hơn",
          button_share: "Chia Sẻ",
          mission_menu_title: {
            SWAP_TO: "Nhiệm Vụ Giao Dịch Memecoin",
            HM_TIME_TRAVEL: "Nhiệm Vụ Du Hành Thời Gian",
            BRIDGE_FROM: "Nhiệm Vụ Kết Nối",
          },
          mission_value1_title: {
            SWAP_TO: "Khối lượng giao dịch",
            HM_TIME_TRAVEL: "Du hành thời gian",
            BRIDGE_FROM: "Khối lượng cầu",
          },
          streak: "Chuỗi",
          tinker_lab_rankings: "Xếp hạng Tinker Lab",
          streak_rankings: "Xếp hạng chuỗi",
        },
        promo: {
          title: "🌕 Tham gia Harvest MOON!",
          description_1: "Cách mới và đơn giản để chơi & kiếm trong thế giới tiền điện tử:",
          description_2: "🎮 Chơi: Công việc vui vẻ để nhận phần thưởng",
          description_3: "🌙 Thu hoạch: Nhận token $MOON",
          description_4: "🚀 Kiếm: $MOON = Airdrop",
          button_go: "Đi thôi!",
        },
        menu: {
          title: {
            [EHarvestMoon_Menu.home]: "",
            [EHarvestMoon_Menu.lab]: "LUMEN LAB",
            [EHarvestMoon_Menu.tinker]: "TUYỂN DỤNG TINKER",
            [EHarvestMoon_Menu.referral]: "CỔNG GIỚI THIỆU",
            [EHarvestMoon_Menu.quest]: "NHIỆM VỤ CRYPTO",
            [EHarvestMoon_Menu.setting]: "CÀI ĐẶT",
          },
          description: {
            [EHarvestMoon_Menu.home]: "",
            [EHarvestMoon_Menu.lab]:
              "Nâng cấp container của bạn để thu hoạch lâu dài hơn và tăng sức chứa lab để tuyển dụng thêm nhiều Tinkers.",
            [EHarvestMoon_Menu.tinker]:
              "Sử dụng hợp đồng để tuyển dụng dựa trên cơ hội của những người thợ rèn, những người thu hoạch ánh trăng với các tỷ lệ khác nhau.",
            [EHarvestMoon_Menu.referral]:
              "Mỗi bạn mời sẽ kiếm cho bạn một Hợp đồng Liên minh Cơ bản + 20% của $MOON của họ, mãi mãi.",
            [EHarvestMoon_Menu.quest]:
              "Nhiệm vụ tăng cường kỹ năng crypto của bạn và tận dụng sức mạnh của DeFi cho lợi ích của bạn.",
            [EHarvestMoon_Menu.setting]: "",
          },
        },
        harvest_summary: {
          not_eligible: "Không đủ điều kiện",
          label_click_to_reveal_prize: "Nhấn để Hiện Giải Thưởng",
          label_you_have_won: "Bạn đã chiến thắng một",
          label_and_token_drop: "và một token drop",
          label_won_token_drop: "Bạn đã thắng một token drop",
          button_click_to_continue: "Nhấn để tiếp tục",
          contract_type: {
            basic: "HỢP ĐỒNG CƠ BẢN",
            advanced: "HỢP ĐỒNG NÂNG CAO",
            expert: "HỢP ĐỒNG CHUYÊN GIA",
          },
          title: "Tóm Tắt Thu Hoạch",
          description:
            "Thu hoạch của bạn đã hoàn thành! Xem Tinkers của bạn đã thực hiện như thế nào và nếu bạn đủ điều kiện cho các hợp đồng hoặc token drop",
          congratulations: "Chúc mừng",
          contract_drop: "Hợp đồng Drop",
          token_drop_campaign: "Chiến dịch Token Drop",
          criteria_not_met_title: "Không đạt tiêu chí",
          criteria_not_met_desc:
            "Bạn không đáp ứng tiêu chí chiến dịch, muốn phần của bạn trong $25K USDC?",
          win_rate: "Tỷ lệ thắng",
          better_luck_next_time_title: "Chúc may mắn lần sau",
          better_luck_next_time_desc_1:
            "Cải thiện cơ hội của bạn bằng cách nâng cấp tài khoản của bạn",
          better_luck_next_time_desc_2: "Token drop luôn có cơ hội 50/50",
          you_have_won: "Bạn đã thắng",
          learn_more: "Tìm hiểu thêm",
          you_got: "Bạn đã nhận được",
          view_more: "Xem thêm",
          traded: "Đã giao dịch",
          text_upgrade_container:
            "Lưu trữ $MOON cao hơn tăng tỷ lệ rơi và kích thước thu hoạch của bạn.",
          text_upgrade_tier: {
            one: "Cấp 1 – Bạn chỉ đủ điều kiện cho các Hợp đồng Cơ bản.",
            two: "Cấp 2 – Bạn đủ điều kiện cho các Hợp đồng Cơ bản và Nâng cao.",
            three: "Cấp 3 – Bạn đủ điều kiện cho các Hợp đồng Cơ bản, Nâng cao và Chuyên gia.",
          },
          subtitle: "BIÊN NHẬN THU HOẠCH",
          label_container_size: "THỜI GIAN TỔNG CỘNG",
          label_lab_capacity: "PHÒNG THÍ NGHIỆM LUMEN",
          label_total_moon_tokens: "TỔNG SỐ $MOON",
          text_moon: "$MOON",
          text_moon_harvested: "Đã Thu Hoạch",
          text_moon_per_hour: "$MOON / Giờ",
          text_union_contract_chance: "XỔ SỐ HỢP ĐỒNG LIÊN MINH!",
          text_harvest_and_win: "THU HOẠCH & THẮNG",
          text_tinkers: "Thợ sửa chữa",
          text_get_referral:
            "Nhận phần thưởng bằng cách chia sẻ điều này trên X! (bao gồm liên kết giới thiệu)",
          label_win: "CHÚC MỪNG",
          text_win: "Bạn đã thắng {contract_type}!",
          label_lose: "LẦN SAU!",
          text_lose: "THU HOẠCH LẠI ĐỂ CÓ CƠ HỘI ĐƯỢC HỢP ĐỒNG LIÊN MINH!",
          button_close: "Đóng",
          share_on_x: "Chia sẻ trên X",
          rank: "Hạng",
          content_share_on_x: `Tóm tắt Thu hoạch Mới nhất của tôi: Tinkers giúp tôi thu hoạch các token $MOON miễn phí cho các lần phát airdrop trong tương lai

Harvest Moon là gì? Cách đơn giản nhất để chơi và kiếm tiền crypto, tất cả thông qua @MeteorWallet

Sẵn Sàng Tham Gia?
3 lần nhấp đầu tiên giành được vé vàng cho Beta`,
          label_upgrade_your_account: "Nâng cấp tài khoản của bạn",
          label_harvesting_longer_hours: "Thu hoạch trong thời gian dài hơn",
          label_enhance_your_moon_container: "Nâng cao Bình Chứa MOON của bạn",
          button_upgrade: "Nâng Cấp Ngay",
          button_enhance: "Nâng Cao Ngay",
          label_next_time: "LẦN SAU!",
          text_next_time:
            "Ồ, cải thiện cơ hội của bạn trong việc đảm bảo một hợp đồng liên minh bằng cách:",
          label_new_moon_balance: "Số Dư $MOON",
          label_drop_rate: "Tỷ Lệ Rơi",
          hint_drop_rate:
            "Thời gian thu hoạch càng lâu, tỷ lệ rơi hợp đồng của bạn càng cao. Ngoài ra, cấp độ người chơi và nâng cấp container của bạn cũng ảnh hưởng đến tỷ lệ rơi hợp đồng.",
          label_no_drop: "Không Rơi",
          label_drop: "Thả",
          reward: "Phần thưởng",
          result: "Kết quả",
          win: "Thắng",
          try_again: "Thử lại",
          win_odd: "Tỷ lệ thành công",
          random_odd: "Lăn cơ hội",
        },
        recruitment: {
          text_recruit_with: "TUYỂN DỤNG BẰNG",
          text_tinkers_to_recruit: "Bạn muốn tuyển bao nhiêu Tinker?",
          warning_max_tinker_count: "Bạn chỉ có thể tuyển tối đa ",
          button_use_max: "SỬ DỤNG TỐI ĐA",
          button_recruit: "TUYỂN DỤNG",
        },
        recruitment_reveal: {
          text_the: "CÁI",
          text_moon_per_hour: "$MOON / GIỜ",
          button_skip: "BỎ QUA",
          button_click_to_continue: "NHẤN ĐỂ TIẾP TỤC",
        },
        recruitment_summary: {
          title: "TÓM TẮT TUYỂN DỤNG",
          text_mph: "MPH",
          text_new_mph: "MPH MỚI",
          button_ok: "ĐỒNG Ý",
          share_on_x: "CHIA SẺ TRÊN X",
          label_max_capacity_reached: "Đã đạt đến công suất tối đa của phòng lab",
          button_details: "Chi tiết",
          button_upgrade_lab: "Nâng cấp Lab ngay",
          content_share_on_x: `Tuyển dụng Tinker mới của tôi: họ giúp tôi thu hoạch được các token $MOON miễn phí cho các lần phát airdrop trong tương lai

Harvest Moon là gì? Cách đơn giản nhất để chơi và kiếm tiền crypto, tất cả thông qua @MeteorWallet

Sẵn Sàng Tham Gia?
3 lần nhấp đầu tiên giành được vé vàng cho Beta`,
          text_get_more_contract: "NHẬN THÊM HỢP ĐỒNG BẰNG CÁCH CHIA SẺ BÀI VIẾT LÊN X",
          text_referral_link: "LIÊN KẾT GIỚI THIỆU ĐƯỢC THÊM TỰ ĐỘNG",
        },
        fusion_summary: {
          title: "Tóm Tắt Du Hành Thời Gian",
          label_total_travelled: "Tổng Số Lần Du Hành",
          label_total_success: "Tổng Số Thành Công",
          label_total_failed: "Tổng Số Thất Bại",
        },
        account_verified: {
          title: "TÀI KHOẢN ĐÃ XÁC THỰC",
          description: "Tài khoản Telegram của bạn đã được xác thực.",
          button_ok: "ĐỒNG Ý",
        },
        coming_soon: {
          title: "SẮP RA MẮT",
        },
        warning: {
          title: "CẢNH BÁO",
          button_ok: "ĐỒNG Ý",
        },
        production_guide: {
          title: "THU HOẠCH ÁNH TRĂNG",
          text_moon_per_hour: "$MOON/GIỜ",
          text_with: "VỚI",
          text_hour: "GIỜ",
          text_container: "CONTAINER",
          text_max_harvest: "TỐI ĐA THU HOẠCH",
          text_get_more_moon: "Thêm $MOON/giờ?",
          text_get_more_hours: "Thêm giờ? ",
          link_get_tinkers: "Nhận Tinkers",
          link_upgrade_container: "Nâng cấp Container",
        },
        storage_guide: {
          title: "LƯU TRỮ ÁNH TRĂNG",
          link_upgrade_container: "Nâng cấp Container",
          text_your_storage: "LƯU TRỮ CỦA BẠN LÀ",
          text_full_and_fills: "đầy",
          text_every: "mỗi",
          text_hours: "giờ",
          text_want_more_hours: "Muốn thêm giờ?",
        },
        tinker_guide: {
          title: "SỔ TAY KHÁM PHÁ",
          text_moon: "$MOON",
          text_harvest_rates: "TỶ LỆ THU HOẠCH",
          text_every_hour: "MỖI GIỜ",
        },
      },
      tinker: {
        name: {
          "1": "Thực Tập Sinh",
          "2": "Nghiên Cứu Viên",
          "3": "Nhà Khoa Học",
          "4": "Thiên Tài",
          "5": "Não To",
        },
      },
      contract: {
        name: {
          [EHM_UnionContractTypes.basic]: "Cơ bản",
          [EHM_UnionContractTypes.advanced]: "Nâng cao",
          [EHM_UnionContractTypes.expert]: "Chuyên gia",
        },
        fullname: {
          [EHM_UnionContractTypes.basic]: "HỢP ĐỒNG CƠ BẢN",
          [EHM_UnionContractTypes.advanced]: "HỢP ĐỒNG NÂNG CAO",
          [EHM_UnionContractTypes.expert]: "HỢP ĐỒNG CHUYÊN GIA",
        },
        description: {
          [EHM_UnionContractTypes.basic]:
            "Tuyển chủ yếu là Thực tập sinh, đôi khi là Nhà nghiên cứu",
          [EHM_UnionContractTypes.advanced]: "Tuyển chủ yếu các Nhà Khoa Học, đôi khi là Thiên Tài",
          [EHM_UnionContractTypes.expert]: "Tuyển chủ yếu là Thiên Tài, đôi khi là Não To",
        },
      },
      tinker_phase: {
        title: {
          [EHarvestMoon_TinkerGuideModalPhase.active_tinker]: "TINKERS ĐANG HOẠT ĐỘNG",
          [EHarvestMoon_TinkerGuideModalPhase.union_contract]: "HỢP ĐỒNG LIÊN MINH",
        },
        description: {
          [EHarvestMoon_TinkerGuideModalPhase.active_tinker]:
            "Nhiều Tinkers hơn không gian? Chúng tôi đặt những người giỏi nhất vào làm việc. Đảm bảo phòng thí nghiệm của bạn có đủ chỗ để tận dụng tối đa từ Tinkers của bạn.",
          [EHarvestMoon_TinkerGuideModalPhase.union_contract]:
            "Sử dụng hợp đồng để tuyển dụng dựa trên cơ hội của những người thợ rèn, những người thu hoạch ánh trăng với các tỷ lệ khác nhau.",
        },
      },
      share: {
        telegram: `𝗕ạn đã nghe về Harvest MOON chưa? Tôi vừa tham gia và đây là cách đơn giản nhất để chơi & kiếm trong thế giới tiền điện tử - được cung cấp bởi Meteor Wallet.
  
🎮 Chơi: Nhiệm vụ vui vẻ để nhận phần thưởng

🌙 Thu hoạch: Nhận token $MOON

🚀 Kiếm: $MOON = Airdrop Meteor

Sẵn Sàng Tham Gia?
3 lần nhấp đầu tiên giành được vé vàng cho Beta
  `,
      },
    },
    common: {
      transaction_not_safe_ids: {
        [ETransactionNotSafeId.not_safe_delete_account]: {
          title: "Phát hiện Xóa Tài khoản",
          desc: "Có vẻ như một ứng dụng bên ngoài đang cố gắng xóa tài khoản của bạn trong giao dịch này. Chúng tôi ngăn chặn việc thực hiện giao dịch này. Vui lòng sử dụng Meteor Wallet trực tiếp nếu bạn muốn xóa tài khoản của mình.",
        },
        [ETransactionNotSafeId.not_safe_deploy_contract]: {
          title: "Phát hiện Triển khai Hợp đồng",
          desc: "Có vẻ như một ứng dụng bên ngoài đang cố gắng triển khai một hợp đồng vào tài khoản của bạn trong giao dịch này. Hành động này không an toàn. Chúng tôi ngăn chặn việc thực hiện giao dịch này.",
        },
        [ETransactionNotSafeId.not_safe_add_key_full_access]: {
          title: "Phát hiện Thêm Khóa Truy cập Đầy đủ",
          desc: "Có vẻ như một ứng dụng bên ngoài đang cố gắng thêm một khóa truy cập đầy đủ vào tài khoản của bạn trong giao dịch này. Điều này sẽ cho phép họ rút tiền từ tài khoản của bạn. Chúng tôi ngăn chặn việc thực hiện giao dịch này.",
        },
        [ETransactionNotSafeId.not_safe_delete_key_full_access]: {
          title: "Phát hiện Xóa Khóa Truy cập Đầy đủ",
          desc: "Có vẻ như một ứng dụng bên ngoài đang cố gắng xóa một khóa truy cập đầy đủ khỏi tài khoản của bạn trong giao dịch này. Điều này có thể ngăn bạn truy cập vào tài khoản của mình. Chúng tôi ngăn chặn việc thực hiện giao dịch này.",
        },
      },
      error_ids: {
        [EOldMeteorErrorId.merr_account_access_key_not_found]:
          "Không thể xác định vị trí của khóa truy cập tài khoản.",
        [EOldMeteorErrorId.merr_sign_message_verify_mismatch]:
          "Xác minh thất bại. Chữ ký không khớp.",
        [EOldMeteorErrorId.merr_account_signed_request_mismatch]:
          "Xác minh thất bại. Phát hiện không khớp trong yêu cầu đã ký.",
        [EOldMeteorErrorId.merr_account_signed_request_not_full_access_key]:
          "Yêu cầu không tương ứng với khóa truy cập đầy đủ.",
        [EOldMeteorErrorId.merr_enrollment_failed]: "Đăng ký nhiệm vụ không thành công",
        [EOldMeteorErrorId.merr_enrollment_failed_no_gas]:
          "Số dư không đủ. Vui lòng nạp tiền để tiếp tục.",
        [EOldMeteorErrorId.merr_reward_redeem_failed]:
          "Giao dịch không thành công. Không thể đổi thưởng.",
        [EOldMeteorErrorId.merr_reward_redeem_failed_no_gas]:
          "Số dư không đủ. Vui lòng nạp tiền để tiếp tục.",
        [EOldMeteorErrorId.merr_reward_claim_ft_failed]:
          "Yêu cầu đòi lại phần thưởng token không thành công.",
        [EOldMeteorErrorId.merr_reward_claim_ft_failed_no_gas]:
          "Số dư không đủ. Vui lòng nạp tiền để tiếp tục.",
        [EOldMeteorErrorId.merr_reward_claim_nft_failed]:
          "Yêu cầu đòi lại phần thưởng NFT không thành công.",
        [EOldMeteorErrorId.merr_reward_claim_nft_failed_no_gas]:
          "Số dư không đủ. Vui lòng nạp tiền để tiếp tục.",
        [EOldMeteorErrorId.merr_unwrap_near_failed]: "Quá trình mở gói NEAR không thành công.",
        [EOldMeteorErrorId.merr_profile_update_failed]: "Cập nhật hồ sơ không thành công.",
        [EOldMeteorErrorId.merr_profile_update_pfp_failed]:
          "Cập nhật hình đại diện không thành công.",
        [EErrorId_AccountSignerExecutor.signer_executor_stale_execution]:
          "Thực thi đã hết hạn. Thực hiện quá trình đã bị hết hạn.",
        [EErrorId_AccountSignerExecutor.signer_executor_execution_cancelled]:
          "Thực thi đã hủy. Người dùng đã chấm dứt quá trình.",
        [EErrorId_AccountSignerExecutor.signer_executor_execution_not_finished]:
          "Thực thi bị gián đoạn. Quá trình chưa hoàn thành.",
        [EErrorId_AccountSignerExecutor.signer_executor_only_cancel_async_signing]:
          "Từ chối hủy bỏ. Quá trình ký ký tự không đồng bộ không thể hủy bỏ.",
        [EErrorId_AccountSignerExecutor.signer_executor_ordinal_state_nonexistent]:
          "Lỗi Thực thi Ký giả: Trạng thái Thứ tự không tồn tại",
        [EErrorId_AccountSignerExecutor.signer_executor_step_index_nonexistent]:
          "Lỗi Thực thi Ký giả: Chỉ mục Bước không tồn tại",
        [EErrorId_AccountSignerExecutor.publishing_transaction_not_signed]:
          "Giao dịch chưa được ký. Ký từ chối trên thiết bị Ledger.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed]:
          "Giao dịch thất bại. Quá trình xuất bản không thành công.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome]:
          "Giao dịch thất bại. Quá trình xuất bản không thành công.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome]:
          "Giao dịch thất bại. Quá trình xuất bản không thành công.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error]:
          "Giao dịch thất bại. Quá trình xuất bản không thành công.",
        [EErrorId_AccountSignerExecutor.publishing_delegated_transaction_failed]:
          "Giao dịch thất bại. Quá trình xuất bản không thành công.",
        [EErr_NearLedger.ledger_user_rejected_action]:
          "Người dùng từ chối hành động trên thiết bị Ledger.",
        [EErr_NearLedger.ledger_invalid_data_received]:
          "Dữ liệu không hợp lệ. Dữ liệu không chính xác hoặc bị hỏng nhận từ Ledger.",
        [EErr_NearLedger.ledger_transaction_data_too_large]:
          "Dữ liệu vượt quá giới hạn. Kích thước dữ liệu giao dịch quá lớn cho Ledger.",
        [EErr_NearLedger.ledger_unknown_transport_error]:
          "Lỗi vận chuyển dữ liệu. Vấn đề truyền dữ liệu không xác định với Ledger.",
        [EErr_NearLedger.ledger_device_locked]: "Thiết bị đã bị khóa. Vui lòng mở khóa và thử lại.",
        [EErr_NearLedger.ledger_near_app_not_open]:
          "Ứng dụng NEAR của thiết bị không mở được. Vui lòng mở ứng dụng trên Ledger của bạn và thử lại.",
        [EErr_NearLedger.ledger_device_unknown_error]:
          "Lỗi không xác định. Vấn đề không xác định với thiết bị Ledger.",
        [EErr_NearLedger.ledger_unknown_transport_status_error]:
          "Lỗi vận chuyển. Sự cố truyền dữ liệu không xác định với Ledger.",
        [EErr_NearLedger.ledger_unable_to_process_instruction]: "Không thể xử lý hướng dẫn",
        [EErr_NearLedger.ledger_device_connection_refused]:
          "Lỗi kết nối. Kết nối thiết bị với Ledger bị từ chối",
        [EErr_NearLedger.ledger_device_browser_refresh_needed]: "Trình duyệt cần làm mới.",
      },
      errors: {
        title_unknown_error: "Lỗi không xác định",
        desc_unknown_error:
          "Đã xảy ra một lỗi không xác định. Vui lòng thông báo cho đội ngũ Meteor.",
      },
      maintenance: {
        title_maintenance: "Chúng tôi đang bảo trì",
        desc_maintenance:
          "Vui lòng quay lại sau, chúng tôi đang thực hiện một số cập nhật nhỏ đẹp.",
      },
    },
    services: {
      near: {
        networkNames: {
          [ENearNetwork.testnet]: "Testnet",
          [ENearNetwork.betanet]: "Betanet",
          [ENearNetwork.mainnet]: "Mainnet",
          [ENearNetwork.localnet]: "Mạng cục bộ",
        },
        networkNamesShort: {
          [ENearNetwork.testnet]: "Testnet",
          [ENearNetwork.betanet]: "Beta",
          [ENearNetwork.mainnet]: "Mainnet",
          [ENearNetwork.localnet]: "Local",
        },
      },
      refresh: {
        refreshText: "Làm mới",
        updatingText: "Đang cập nhật",
      },
      copy: {
        common: "Đã sao chép {data}",
        copy_id: "Sao chép ID ví",
        wallet: "Đã sao chép ID ví",
      },
      delete: {
        common: "Xóa tài khoản",
        delete: "Xóa bỏ",
        cancel: "Hủy bỏ",
        delete_this_account: "Xóa tài khoản này",
        delete_this_account_note: "Bạn có chắc chắn muốn xóa tài khoản này khỏi ví của mình không?",
      },
      fund: {
        almost_there: "Sắp xong rồi!",
        check_now: "Kiểm tra ngay",
        checking: "Đang kiểm tra...",
        send_at_least: "Gửi ít nhất 0,1 NEAR tới địa chỉ ví của bạn để kích hoạt tài khoản",
        fund_via_testnet: "Nạp tiền qua Testnet",
        checking_again_in: "Kiểm tra lại trong",
        error_occurred: "Đã xảy ra lỗi khi truy vấn trạng thái ví",
      },
      user: {
        needLogin: "Bạn cần đăng nhập để làm điều đó.",
      },
    },
    buttonText: {
      createNewAccount: "Tạo ví mới",
      importAccount: "Nhập một ví hiện có",
      updateText: "Cập nhật",
      continueText: "Tiếp tục",
      confirmText: "Xác nhận",
      createWallet: "Tạo ví",
    },
    sidebarUi: {
      button_addWallet: "Thêm Ví",
      button_settings: "Cài đặt",
      button_signOut: "khóa ví",
      noWalletBlurb: "Tạo hoặc nhập ví mới để bắt đầu",
      notSignedInBlurb: "Đăng nhập để truy cập ví của bạn",
    },
    mainUi: {
      menu_button_wallets: "Ví",
      heading_myAssets: "Tài sản của tôi",
      button_deposit: "Nạp",
      button_send: "Gửi",
      button_stake: "Stake",
      button_swap: "Giao dịch",
      button_explore: "Khám phá",
      button_bridge: "Cầu nối",
      updating: "Đang cập nhật...",
    },
    pageContent: {
      walletConnect: {
        blurb_noAccountFound:
          "Không tìm thấy tài khoản Ví Meteor nào để kết nối với ứng dụng bên ngoài",
      },
      linkdrop: {
        title_incorrect_link_format: "Opps, đã xảy ra lỗi",
        description_incorrect_link_format:
          "Định dạng liên kết không chính xác. Vui lòng kiểm tra url của bạn và thử lại",
        title_drop_claimed: "Drop đã được yêu cầu.",
        description_drop_claimed:
          "NEAR Drop này đã được yêu cầu trước đó. NEAR Drops chỉ có thể được sử dụng để tạo một tài khoản duy nhất và liên kết sẽ hết hạn sau đó.",
        title_received_drop: "Bạn đã nhận được NEAR drop!",
        title_received_ft_drop: "Bạn đã nhận được {symbol} drop!",
        description_received_drop: "Yêu cầu với một tài khoản hiện có hoặc tạo tài khoản mới",
        claim: "Yêu cầu",
        claim_with_following_account: "Yêu cầu với tài khoản sau đây:",
        claim_with_new_account: "Yêu cầu với tài khoản mới",
        claim_success_title: "Xác nhận",
        claim_success_description: "Bạn đã yêu cầu thành công drop",
        claim_success_with_redirect_description:
          "Bạn đã thành công khi yêu cầu nhận phần thưởng và sẽ được chuyển hướng trở lại ứng dụng trong thời gian sớm nhất.",
        something_went_wrong_title: "Đã xảy ra sự cố",
        something_went_wrong_description: "Vui lòng thử lại sau hoặc sử dụng liên kết khác.",
        or: "Hoặc",
      },
      linkdropClaimedSuccess: {
        title: "Bỏ xác nhận quyền sở hữu",
        subtitle: "Tài sản được tặng đã được thêm vào ví của bạn thành công!",
        button_redirect: "Quay lại trang web",
      },
      topup: {
        heading_get_near: "Nhận $NEAR",
        buy_near: "Mua $NEAR",
        onramper_description:
          "Công cụ tổng hợp có tất cả các onramp chính từ fiat sang tiền điện tử",
        bridge_from_eth_aurora: "Cầu từ Ethereum/Aurora",
        rainbow_bridge_description: "Cầu nối giữa hoặc gửi trong Ethereum NEAR và Aurora",
        supported_cex: "Sàn giao dịch tập trung được hỗ trợ",
        okx_description: "Khám phá tiền điện tử trên một trong những thế giới",
        binance_description:
          "Hệ sinh thái chuỗi khối và trao đổi tài sản kỹ thuật số hàng đầu thế giới.",
        huobi_description: "Sàn giao dịch hàng đầu thế giới",
        kraken_description: "Kraken là cầu nối của bạn với thế giới tiền điện tử.",
      },
      extensionConnect: {
        blurb_extensionInstalled:
          "Giờ đây, tài khoản của bạn cũng có thể được truy cập thông qua tiện ích mở rộng!",
        title_extensionInstalled: "Đã cài đặt tiện ích mở rộng sao băng",
        button_text_continueToApp: "Tiếp tục",
      },
      walletHome: {
        subtext_availableFunds: "Số dư khả dụng",
        tooltip_availableFunds:
          "Số dư có thể chi tiêu của bạn không bao gồm tiền bị khóa hoặc đang stake.",
        warning_needsRecoveryBackup: "Cụm từ khôi phục ví chưa được sao lưu",
        warning_needsRecoveryBackup_desc:
          "Sao lưu cụm từ hạt giống ví của bạn để tránh mất tài sản",
        warning_needsRecoveryBackup_btn: "Sao lưu ngay bây giờ",
        warning_insecureWallet: "Ví không được mã hóa",
        warning_insecureWallet_desc:
          "Đặt mật khẩu để bảo vệ ví của bạn thông qua mã hóa dữ liệu nhạy cảm",
        warning_insecureWallet_btn: "Đặt Mật khẩu",
        warning_networkIssue_title: "Vấn đề về mạng",
        warning_networkIssue_desc:
          "Mạng Near Protocol đang gặp vấn đề về tắc nghẽn. Giao dịch có thể chậm hơn bình thường và một số tính năng có thể tạm thời không truy cập được.",
        warning_scamTokenCount: "{count} token lừa đảo bị ẩn",
        warning_scamTokenCount_multi: "{count} token lừa đảo bị ẩn",
        warning_hiddenTokenCount: "{count} token số dư nhỏ bị ẩn",
        warning_hiddenTokenCount_multi: "{count} token số dư nhỏ bị ẩn",
        button_updates: "Cập nhật",
        tooltip_recent_updates: "Bạn có thể tìm thấy các cập nhật mới nhất ở đây",
        tooltip_total_balance: "Tổng Số Dư",
        tooltip_storage_reserve: "Dự Trữ Lưu Trữ",
        tooltip_gas_reserve: "Dự Trữ Gas",
        tooltip_spendable: "Có Thể Chi Tiêu",
        import_token: {
          title: "Nhập Token",
          description: "Nhập địa chỉ token để nhập token vào ví của bạn",
          placeholder: "Tìm kiếm Địa chỉ Token ...",
          button_add_token: "Thêm Token Đã Chọn",
          market_price: "Giá Thị Trường",
          my_balance: "Số Dư Của Tôi",
          my_balance_in_usd: "Số Dư Của Tôi bằng USD",
          warning_please_enter_token: "Vui lòng nhập địa chỉ hợp đồng token ở trên",
          warning_invalid_token: "Địa chỉ token bạn nhập không hợp lệ",
          toast_title_token_added: "Token Đã Được Thêm Thành Công",
          toast_text_token_added: "Bạn đã thêm token thành công",
        },
      },
      addressBook: {
        text_noAddressesFound: "Không tìm thấy địa chỉ nào",
        heading_otherOwnedAccounts: "Ví khác của bạn",
        heading_savedAccounts: "Địa chỉ đã lưu",
        heading_recentlyUsedAccounts: "Địa chỉ được sử dụng gần đây",
      },
      walletDeposit: {
        heading_deposit: "Tiền gửi",
        text_copy_wallet: "Sao chép ID ví",
      },
      walletSwap: {
        swap: "Tráo đổi",
        confirm_swap: "Xác nhận Hoán đổi",
        something_wrong: "Đã xảy ra sự cố",
        failed_build_transaction: "Không thể xây dựng giao dịch",
        preparing_transaction: "Chuẩn bị giao dịch của bạn",
        getting_transaction_ready: "Chuẩn bị giao dịch của bạn.",
        executing_step: "Bước thực hiện",
        calling: "gọi",
        you_receive: "Bạn nhận được",
        you_pay: "Bạn trả tiền",
        swap_successful: "hoán đổi thành công",
        swap_success_desc: "Bạn đã đổi token thành công",
        swap_failed: "Hoán đổi không thành công",
        swap_failed_desc:
          "Đã xảy ra sự cố. Vui lòng kiểm tra lịch sử giao dịch của bạn để biết thêm chi tiết.",
        close: "Đóng",
        review_swap: "Đánh giá Hoán đổi",
        route_not_found: "Không tìm thấy tuyến đường",
        inadequate_balance: "Số dư không đủ",
        show_all_routes: "Hiển thị tất cả các tuyến đường có sẵn",
        to_contract: "ký hợp đồng",
        do_no_close_page: "Vui lòng không đóng trang này hoặc làm mới trình duyệt của bạn",
        provider: "Các nhà cung cấp",
        price_impact: "Tác động giá",
        meteor_fee: "Phí Meteor",
        meteor_fee_desc: "Không Phí, Chỉ Có Tỷ Giá Tốt Nhất",
        provider_fee: "Phí Nhà Cung Cấp",
        network_fee: "Phí mạng",
        swap_fee: "Phí hoán đổi",
        route: "Tuyến đường",
        minimum_received: "Sẽ nhận tối thiểu",
        best_route: "Tuyến đường tốt nhất",
        find_token_hint: "Tìm kiếm token với ký hiệu token, tên hoặc địa chỉ",
        label_swap_details: "Chi tiết Hoán đổi",
        label_please_enter_amount: "Vui lòng nhập số lượng",
        label_select_token: "Chọn Token",
        hint_search_token: "Tìm kiếm ký hiệu, tên hoặc địa chỉ token",
        label_slippage: "Độ trượt giá",
        button_confirm: "Xác nhận",
        title_slippage: "Cài đặt độ trượt giá",
        desc_slippage:
          "Giao dịch của bạn sẽ thất bại nếu giá thay đổi nhiều hơn độ trượt giá. Giá trị quá cao sẽ dẫn đến giao dịch không có lợi.",
        // label_support_fees:
        //   "Báo giá bao gồm {METEOR_SWAP_FEE}% phí Meteor để hỗ trợ đội ngũ",
        label_support_fees:
          "Chúng tôi hiện không thu phí, nhưng phí có thể được thêm vào trong tương lai.",
        label_loading: "Đang tải",
        label_fees: "Phí",
        label_quote: "Báo giá",
        label_error_message: "Thông báo lỗi",
        label_successful: "Thành công",
        description_success:
          "Giao dịch của bạn đã hoàn tất thành công! Các token đã hoán đổi hiện có sẵn trong ví của bạn.",
        description_failed:
          "Hoán đổi thất bại do biến động giá vượt quá dung sai trượt giá của bạn (${oldSlippage}%). Thử lại với dung sai cao hơn (${suggestedSlippage}).",
        label_swap_summary: "Tóm tắt Hoán đổi",
        label_you_send: "Bạn Gửi",
        label_you_received: "Bạn Nhận",
        button_back_to_home: "Trở về Trang chủ",
        button_back_to_redirect_url: "Quay lại chuyển hướng Url",
        button_try_again: "Thử Lại",
        title_slippage_error: "Rất tiếc, Lỗi Trượt giá!",
      },
      walletStake: {
        liquid_staking: "Liquid Staking",
        standard_staking: "Staking tiêu chuẩn",
        liquid_staking_desc:
          "stake NEAR của bạn để nhận token cổ phần. Sau đó, bạn có thể tái đầu tư những thứ này.",
        standard_staking_desc: "Khóa NEAR của bạn để nhận ~10% APY",
        create_new_staking: "Tạo cổ phần mới",
        create_new_staking_desc: "Kiếm phần thưởng ngay bây giờ bằng cách khóa NEAR của bạn!",
        my_staked_validators: "Danh sách trình xác thực đang stake",
        display_newly_staked_note:
          "Có thể mất ~1 phút để hiển thị trình xác thực mới stake của bạn.",
        search_validator: "Tìm kiếm trình xác thực",
        load_more: "Xem thêm",
        something_wrong: "Có một vấn đề",
        staking_failed: "Stake không thành công",
        unstake_failed: "Hủy stake không thành công",
        staking_failed_went_wrong: "Staking không thành công: đã xảy ra sự cố",
        unstake_failed_went_wrong: "Hủy stake không thành công: đã xảy ra sự cố",
        staked_success: "stake thành công",
        staked_success_msg: "Bạn đã stake thành công",
        unstaked_success: "Đã hủy stake thành công",
        unstaked_success_msg: "Bạn đã hủy stake thành công",
        review_staking: "Đánh giá stake",
        review_unstaking: "Đánh giá",
        you_stake: "bạn stake:",
        you_unstake: "bạn gỡ bỏ:",
        you_receive: "bạn nhận được",
        validator_details: "Chi tiết Trình xác thực",
        confirm: "Xác nhận",
        staking: "Stake",
        close: "đóng",
        stake: "Stake",
        unstake: "Hủy stake",
        to: "Đến",
        from: "Từ",
        create_liquid_staking: "Liquid staking",
        liquid_unstake: "Rút liquid staking",
        minimum_liquid_note: "Số tiền stake thanh khoản tối thiểu là",
        staking_details: "Chi tiết stake",
        you_are_staking: "Bạn đang stake",
        staking_with: "với",
        days: "ngày",
        estimated_earnings: "Thu nhập ước tính",
        select_your_validator_pool: "Chọn Trình xác thực/Nhóm của bạn",
        select_validator: "Chọn Trình xác thực",
        insufficient_balance: "Không đủ số dư",
        use_max: "Sử dụng tối đa",
        available: "Có sẵn",
        create_standard_staking: "Stake bình thường",
        amount_to_unstake_in: "Số tiền hủy stake",
        active: "Đang hoạt động",
        reward_token_s: "Thưởng token",
        inactive: "Không hoạt động",
        total_staked: "Tổng số stake",
        estimated_apy: "APY ước tính",
        staked_near: "Đã stake NEAR",
        staked_near_tooltip: "Số NEAR stake. Phần thưởng NEAR sẽ tự động được cộng dồn.",
        unclaimed_reward: "Phần thưởng chưa được nhận",
        unclaimed_reward_tooltip:
          "Phần thưởng đã kiếm được, nhưng không được rút. Phần thưởng NEAR sẽ tự động được đặt lại.",
        you_unstaking: "Bạn đang gỡ stake",
        usually_take_72_hour_unstake: "và thường mất 48~72 giờ để gỡ stake",
        unstaked_ready_to_claimed: "Tài sản đã gỡ stake của bạn đã sẵn sàng",
        claim_unstaked: "Xác nhận quyền sở hữu",
        stake_more: "Cổ phần Thêm",
        claim_reward: "Yêu cầu phần thưởng",
        provider: "Các nhà cung cấp",
        liquid_unstake_fee: "Phí rút tiền thanh khoản",
        unlock_period: "Thời gian mở khóa",
        total_near_staked: "Tổng số NEAR đang stake",
        balance: "Số dư",
        value_in_near: "Giá quy ra NEAR",
        and_it_usually_takes: "và nó thường mất",
        to_unstake: "để gỡ",
        delayed_unstake: "Rút stake chậm",
      },
      walletSend: {
        heading_send: "Gửi",
        input_heading_sendTo: "Gửi đến",
        button_useMax: "Sử dụng tối đa",
        input_heading_selectAsset: "Chọn tài sản",
        text_accountIdInfo:
          "ID tài khoản phải bao gồm Tài khoản cấp cao nhất, chẳng hạn như .near hoặc chứa chính xác 64 ký tự.",
        input_placeHolder_sendTo: "Gửi đến ID tài khoản",
        tooltip_addressBook: "Sổ địa chỉ",
        use_max: "Sử dụng tối đa",
        available: "Có sẵn",
        no_account_provide: "Không có tài khoản cung cấp",
        account_id_note_1: "Hãy đảm bảo tài khoản này hợp lệ như",
        account_id_note_2:
          "Đây là token không chính thức (Bridge token). Không gửi nó đến sàn giao dịch như Binance.",
        account_id_note_3:
          "ID tài khoản phải là địa chỉ NEAR hợp lệ (ví dụ: .near hoặc địa chỉ ngầm định) hoặc địa chỉ EVM hợp lệ.",
        account_check_errors: {
          invalid_account: "Tài khoản không hợp lệ",
          invalid_account_format: "Định dạng tài khoản không hợp lệ",
          invalid_account_length_long: "Độ dài tài khoản không hợp lệ (quá dài)",
          invalid_account_length_short: "Độ dài tài khoản không hợp lệ (quá ngắn)",
        },
        error_empty_amount: "Vui lòng điền vào trường số tiền",
        warning_address_non_standard:
          "Địa chỉ bạn đang gửi ({accountSuffix}) không phải là địa chỉ chuẩn với hậu tố {mạng} ",
        sending_bridged_token_alert:
          "Không gửi token này đến bất kỳ CEX nào như Binance, điều này có thể dẫn đến mất tài sản vĩnh viễn.",
        account_no_exists_warning: "Tài khoản chưa tồn tại",
        named_account_no_exists_warning:
          "Gửi đến một tài khoản được đặt tên chưa tồn tại có thể sẽ thất bại",
        account_no_exists_warning_deposit:
          "Tài khoản chưa tồn tại - nó sẽ được tạo tự động trên khoản tiền gửi này",
        sending: "Gửi",
        to: "Đến",
        account_exists: "Tài khoản tồn tại",
        send: "Gửi",
        confirm_send: "Xác nhận Gửi",
        finish: "Kết thúc",
        txID: "ID giao dịch",
        sendFtSuccess: "Gửi FT thành công",
        sendSuccess: "Gửi thành công",
        mode_not_support: "chế độ không được hỗ trợ",
        receiver_balance: "Tài khoản hiện tại đang có số dư {balance} {symbol}",
        receiver_balance_fail: "Không thể lấy số dư",
        input_error_ft: "{label} không thể chuyển nhượng",
      },
      importWallet: {
        heading_confirmAccount: "Nhập tài khoản của bạn",
        blurb_confirmAccount: "Chọn ví bạn muốn nhập",
        heading_inputPhraseSection: "Cụm từ bí mật",
        blurb_inputPhraseSection: "Cung cấp cụm từ khôi phục bí mật của ví để nhập ví",
        heading_chooseInputType: "Bạn muốn nhập ví của mình như thế nào?",
        heading_passwordSection: "nhập ví",
        heading_inputPrivateKeySection: "Khóa riêng",
        blurb_inputPrivateKeySection: "Cung cấp khóa riêng của ví để nhập ví",
        blurb_passwordSection: "Cần có mật khẩu ví để nhập ví",
        toast_title_noAccountFound: "Không tìm thấy tài khoản",
        toast_text_noAccountFound:
          "Không thể tìm thấy bất kỳ tài khoản nào được liên kết với cụm từ khôi phục bí mật đó",
        toast_title_unknownError: "Tìm kiếm không thành công",
        toast_text_unknownError:
          "Đã xảy ra lỗi API khi cố kiểm tra tài khoản. Kiểm tra kỹ cụm từ và thử lại.",
        toast_text_invalidKey: "Khóa không hợp lệ. Vui lòng kiểm tra đầu vào của bạn và thử lại.",
        a_12_word_secret: "Một cụm từ bí mật 12 từ",
        secret_phrase: "Cụm từ bí mật",
        private_key: "Khóa riêng",
        private_key_desc: "Khóa riêng của tài khoản",
        hardware: "Ledger",
        hardware_desc: "Một ví tiền phần cứng",
        words_12: "12 từ",
        private_crypto_key: "Khóa mật mã riêng",
        find_my_account: "Tìm tài khoản của tôi",
        account: "Tài khoản",
        already_imported: "Đã nhập",
        text_approve_ledger: "Phê duyệt trên thiết bị",
        dont_see_wallet: "Không thể tìm thấy tài khoản của bạn?",
        manual_import_here: "Nhập nó thủ công.",
      },
      manualImport: {
        manual_import_account: "Nhập Tài Khoản Thủ Công",
        import: "Nhập Tài Khoản",
        insert_your_account_id: "Nhập id tài khoản của bạn vào đây để nhập tài khoản",
        incorrect_account_id:
          "Định dạng id tài khoản không hợp lệ, cần thuộc về một tài khoản gốc như .near, .tg hoặc .sweat",
        account_not_exist_or_not_match: "Tài khoản không tồn tại hoặc khóa truy cập không khớp",
        account_info_network_error:
          "Có lỗi xảy ra khi lấy thông tin tài khoản. Vui lòng thử lại sau",
        account_found_and_import: "Đã tìm thấy tài khoản, bạn có thể nhập tài khoản ngay bây giờ",
        close: "Đóng",
      },
      importWalletHardware: {
        title: "Ví phần cứng",
        subtitle: "Chỉ định HD Path để nhập tài khoản được liên kết của nó",
        toast_title_noAccountFound: "Không tìm thấy tài khoản",
        toast_text_noAccountFound:
          "Không thể tìm thấy bất kỳ tài khoản nào được liên kết với HD Path đó",
      },
      createWalletHardware: {
        title: "Ví phần cứng",
        subtitle: "Chỉ định HD path để tạo ví",
        button_confirm: "Tạo Ví Mới",
        toast_title_noAccountFound: "Tài khoản tồn tại",
        toast_text_noAccountFound: "Tài khoản đã tồn tại trên HD Path đó",
      },
      signTx: {
        receiving_from_dapp: "Nhận thông tin chi tiết từ Dapp",
        couldnt_parse_arg_login: "Không thể phân tích các đối số chính xác để đăng nhập",
        couldnt_parse_arg_logout: "Không thể phân tích các đối số chính xác để đăng xuất",
        connect_request: "Yêu cầu kết nối",
        connect_with_acc: "Kết nối với tài khoản",
        this_app_would_like_to: "Ứng dụng này muốn",
        know_your_add: "Biết địa chỉ ví của bạn",
        know_your_balance: "Biết số dư tài khoản của bạn",
        network_fee_placeholder:
          "Ứng dụng sẽ được phép sử dụng TỐI ĐA 0,25 NEAR cho phí mạng (gas) phát sinh trong quá trình sử dụng.",
        network_fee_allowance: "Trợ Cấp Phí Mạng",
        something_went_wrong: "Đã xảy ra sự cố",
        create_import_wallet: "Tạo hoặc nhập ví mới",
        contract: "Hợp đồng",
        connect: "Liên kết",
        cancel: "Hủy",
        request_logout_could_not_found: "Không thể tìm thấy tài khoản được yêu cầu đăng xuất",
        sign_out_request: "Yêu cầu đăng xuất",
        sign_out_desc: "Bạn đã yêu cầu được ký ngoài hợp đồng",
        wallet: "Ví",
        logout: "Đăng xuất",
        couldnt_parse_arg_verify: "Không thể phân tích các đối số chính xác để xác thực",
        request_authentication_not_found: "Không thể tìm thấy tài khoản được yêu cầu xác thực",
        verification_request: "Yêu cầu xác minh",
        verification_request_desc:
          "Chỉ xác minh danh tính của bạn trên các trang web mà bạn tin tưởng",
        verify_account: "Xác minh bằng tài khoản",
        select_account: "Chọn một tài khoản",
        know_your_chosen_wallet_add: "Đã biết địa chỉ ví bạn đã chọn",
        verify_own_wallet_add: "Xác minh rằng bạn sở hữu địa chỉ ví này",
        does_not_allow: "Điều này không được cho phép",
        calling_method_on_behalf: "Phương pháp gọi hoặc ký giao dịch thay cho bạn",
        verify: "Kiểm chứng",
        estimated_changes: "Thay đổi ước tính",
        send: "Gửi",
        you_sending_asset: "Bạn đang gửi nội dung này",
        you_sending_assets: "Bạn đang gửi những nội dung này",
        couldnt_parse_arg_tx: "Không thể phân tích các đối số chính xác để ký giao dịch",
        approve_transactions: "Phê duyệt giao dịch",
        approve_transaction: "Phê duyệt giao dịch",
        transaction: "Giao dịch",
        approve: "Chấp thuận",
        close_details: "Đóng chi tiết",
        view_transaction_details: "Xem chi tiết giao dịch",
        transaction_details: "chi tiết giao dịch",
        fees_tooltips: 'Còn được gọi là "gas" - phí xử lý mạng cho giao dịch này',
        fees_assurance:
          "Phí thực tế thường thấp hơn 90-95% so với ước tính và số tiền còn lại sẽ được trả lại tự động",
        fees: "phí",
        with_deposit: "Với tiền gửi",
        from: "Từ",
        to: "Đến",
      },
      explore: {
        text_explore: "Khám phá",
        text_challenges: "Thử thách",
        text_missions: "Nhiệm vụ",
        text_rewards: "Phần thưởng",
        trending_projects: "Dự án thịnh hành",
        defi: "DeFi",
        nfts: "NFT",
        near_ecosystem: "Hệ sinh thái NEAR",
        hide: "Ẩn",
        show: "Hiện",
        tonic_desc: "Nền tảng giao dịch phi tập trung hoàn toàn, hiệu suất cao trên NEAR.",
        spin_desc: "Đặt hàng trực tuyến đầu tiên DEX trên NEAR với trải nghiệm giống như CEX.",
        burrow_desc: "Cung cấp và vay tài sản sinh lãi trên Giao thức NEAR.",
        perk_desc: "Công cụ tổng hợp thanh khoản cho NEAR với đầy đủ các token",
        pembrock_desc: "Nền tảng canh tác năng suất đòn bẩy đầu tiên trên NEAR.",
        meta_yield_desc:
          "Một nền tảng gây quỹ cho phép bất kỳ chủ sở hữu $NEAR nào hỗ trợ các dự án.",
        paras_desc: "Thị trường xã hội tất cả trong một dành cho người sáng tạo và nhà sưu tập",
        tradeport_desc: "Nền tảng giao dịch chuỗi chéo tổng hợp NFT từ các thị trường",
        antisocial_desc:
          "$GEAR của riêng chúng tôi là đấu thầu hợp pháp cho chương trình rút thăm trúng thưởng Antisocial Labs. Bước 1: Trao đổi $GEAR qua Meteor hoặc kiếm tiền qua Tinkers. Bước 2: Giành được một NFT",
        near_social_desc: "Một giao thức dữ liệu xã hội cho NEAR",
        near_crash_desc: "Hãy thử và rút tiền trước khi sụp đổ!",
        challenge: {
          btn_view_details: "Xem chi tiết",
          btn_view_winners: "Xem người chiến thắng",
          btn_accept_challenge: "Chấp nhận thử thách",
          btn_challenge_accepted: "Thử thách được chấp nhận",
          status: {
            [EChallengeStatus.COMING_SOON]: "Sắp có",
            [EChallengeStatus.ACTIVE]: "Đang hoạt động",
            [EChallengeStatus.ENDED_WITHOUT_WINNERS]: "Đã kết thúc",
            [EChallengeStatus.ENDED_WITH_WINNERS]: "Đã kết thúc",
            [EChallengeStatus.WINNERS_TO_BE_ANNOUNCED]: "Người chiến thắng sẽ được công bố",
          },
        },
        mission: {
          label_my_profile: "Hồ sơ của tôi",
          label_level: "Cấp độ",
          label_points_earned: "Số điểm kiếm được",
          label_global_ranking: "Xếp hạng toàn cầu",
          text_mission_unlock: "nhiệm vụ đã hoàn thành để mở khóa cấp độ tiếp theo",
          label_daily_tasks: "Công việc hàng ngày",
          label_daily_task: "Nhiệm vụ hàng ngày",
          label_points_reward: "điểm thưởng",
          label_earn_more_side_quest: "Nhiệm vụ phụ",
          label_completed: "Đã hoàn thành",
          label_earned: "kiếm được",
          Button_start_now: "Bắt đầu ngay",
          user_consent: {
            label_title: "Khám phá Nhiệm vụ Meteor!",
            label_description:
              "Tham gia những thử thách hấp dẫn, tích lũy điểm và đổi chúng lấy những phần thưởng tuyệt vời.",
            button_accept: "Vâng, hãy đối mặt với những nhiệm vụ này!",
            text_note:
              "Cảm ơn bạn đã tham gia Meteor Missions! Hãy ngồi im trong khi chúng tôi thiết lập cho bạn (+-15 giây).",
          },
          no_daily_task:
            "Sẵn sàng cho ngày hôm nay! Quay lại vào ngày mai để tiếp tục chuỗi ngày thường xuyên của bạn.",
          no_side_quest:
            "Bạn đã hoàn thành tất cả các nhiệm vụ! Hãy đợi những thử thách mới sắp tới.",
        },
        reward: {
          label_collected_points: "Điểm đã thu thập",
          label_redeem: "Đổi quà",
          label_redeem_history: "Đổi lịch sử",
          label_claim_reward: "Nhận phần thưởng",
          label_left: "trái",
          button_redeem: "Đổi quà",
          button_harvest: "Thu hoạch",
          button_claim: "Nhận",
          no_redeem_title: "Không có phần thưởng khả dụng",
          no_redeem_description: "Hiện tại không có ưu đãi nào sẵn sàng để đổi.",
          no_claim_reward_title: "Không có phần thưởng khả dụng",
          no_claim_reward_description:
            "Bạn không có phần thưởng nào để đổi. Tiếp tục tham gia các nhiệm vụ để kiếm điểm và đổi chúng lấy phần thưởng!",
        },
      },
      meteorCard: {
        home: {
          subtitle:
            "Tham gia cộng đồng Meteor bằng cách đăng ký sớm để nhận DeFi Mastercard độc quyền của chúng tôi. Hãy là một trong những người đầu tiên tận hưởng chi tiêu tiền điện tử liền mạch với thẻ sắp ra mắt của chúng tôi.",
          early_access_end: "Ưu đãi Quyền truy cập sớm kết thúc sau",
          view_perks: "Xem Quyền truy cập",
          apply_now: "Đăng ký ngay",
        },
        perkModal: {
          title1: "Quyền truy cập sớm",
          title2: "Quyền truy cập",
          item_title1: "Tiền đặt cọc hoàn lại toàn bộ",
          item_subtitle1:
            "Đặt chỗ ngay bây giờ chỉ với 5 đô la Mỹ - được hoàn lại toàn bộ, không rủi ro!",
          item_title2: "Phí khuyến mại",
          item_subtitle2:
            "Ưu đãi truy cập sớm: Khóa chỗ của bạn chỉ với 5 đô la Mỹ! (Trị giá 19,99 đô la)",
          item_title3: "Phần thưởng độc quyền",
          item_subtitle3:
            "Kiếm Hợp đồng chuyên gia trong Harvest Moon và tăng tiến độ của bạn để đủ điều kiện nhận airdrop Meteor.",
        },
        signup: {
          title: "Đăng ký Bây giờ",
          subtitle: "Hoàn thành biểu mẫu bên dưới để được quyền truy cập sớm:",
          email: "Địa chỉ email",
          country: "Quốc gia",
          country_placeholder: "Chọn quốc gia",
          estimate_usage: "Bạn sẽ sử dụng thẻ Meteor Mastercard của mình bao nhiêu lần mỗi tháng?",
          early_access_perks: "Quyền truy cập sớm",
          button_proceed: "Tiến hành thanh toán",
          end_in: "Kết thúc trong",
          error_registered: "Bạn đã đăng ký",
          error_signup_status_not_ready:
            "Yêu cầu đăng ký hiện chưa sẵn sàng (trạng thái: {status}). Vui lòng thử lại sau",
        },
        myApplication: {
          application_applied: "Ứng dụng đã được áp dụng",
          title: "Ứng dụng của tôi",
          subtitle:
            "Chúng tôi sẽ sớm liên hệ với bạn để cung cấp thông tin chi tiết về việc ra mắt",
          wallet_id: "ID ví",
          email: "Địa chỉ email",
          country: "country",
          country_placeholder: "Chọn quốc gia",
          cancel: "Hủy ứng dụng",
          update: "Cập nhật",
          error_cancel_status_not_ready:
            "Yêu cầu hủy hiện chưa sẵn sàng (trạng thái: {status}). Vui lòng thử lại sau vài phút",
        },
        insufficientBalance: {
          title: "Số dư không đủ",
          subtitle:
            "Cần phải gửi 5 đô la vào thẻ bằng USDC để kích hoạt ứng dụng truy cập sớm của bạn. Nếu bạn quyết định không nhận thẻ, bạn có thể hủy trong vòng 7 ngày và lấy lại tiền gửi của mình.",
          back: "Quay lại Ví",
          topup: "Nạp USDC",
        },
        estimateUsageOption: {
          [EMeteorCardEstimateUsage.below_250]: "Sử dụng ít (tối đa $250)",
          [EMeteorCardEstimateUsage.from_250_to_1000]: "Sử dụng vừa phải (tối đa $1000)",
          [EMeteorCardEstimateUsage.above_1000]: "Sử dụng nhiều (trên $1000)",
        },
      },
      appSettings: {
        heading_settings: "Cài đặt ứng dụng",
        button_language: "Ngôn ngữ",
        button_addressBook: "Sổ địa chỉ",
        button_subtext_addressBook: "Các địa chỉ thường dùng",
        button_autoLockTimer: "Hẹn giờ tự động khóa",
        button_subtext_autoLockTimer: "Thời lượng hẹn giờ ví tự động khóa",
        button_changePassword: "Đổi mật khẩu",
        button_subtext_changePassword: "Thay đổi mật khẩu mở khóa của bạn",
        button_aboutMeteor: "Giới thiệu về Meteor",
        button_subtext_aboutMeteor: "Thông tin liên hệ và cộng đồng của chúng tôi",
        button_meteorCommunity: "Cộng đồng Meteor",
        button_subtext_meteorCommunity: "Hãy đến và tham gia với chúng tôi",
        sectionConnectedApp: {
          text_deauthorize: "Hủy cấp phép",
          text_gasFeeAllowance: "Phí phụ cấp",
          text_allowedMethod: "Phương pháp được phép",
          text_any: "Bất kỳ",
        },
        sectionProfile: {
          update_profile_warning:
            "Lần đầu tiên cập nhật hồ sơ cần tối đa 0,04 NEAR dưới dạng phí lưu trữ",
          update_pfp_warning:
            "PFP được đặt lần đầu tiên sẽ đính kèm tối đa 0,04 NEAR dưới dạng phí lưu trữ trên mạng lưới.",
          pfp_updated: "PFP cập nhật.",
          profile_updated: "Hồ sơ cá nhân đã cập nhật.",
          name: "Tên",
          about: "Giới thiệu",
          update: "Cập nhật",
          set_pfp: "Đặt PFP",
          pfp_tooltip: "PFP cần được đặt trên trang NFT",
          sync_near_social: "Sử dụng hồ sơ này trên hệ sinh thái NEAR với Near Social.",
          sync_near_social_header: "Đồng bộ hóa với NEAR Social",
          sync_near_social_desc:
            "Lần đầu tiên đồng bộ hóa với NEAR Social sẽ đính kèm tới 0,04 NEAR dưới dạng phí ký gửi lưu trữ.",
          sync_now: "Đồng bộ hóa ngay",
          account_synced: "Tài khoản của bạn được đồng bộ hóa với NEAR Social",
          follower: "Người theo dõi",
        },
        sectionDeleteAccount: {
          text_warning: "Cảnh báo",
          text_delete_password:
            "Vui lòng đảm bảo bạn đã sao lưu phương thức khôi phục của mình hoặc bạn có thể mất quyền truy cập vào tài khoản của mình",
          text_remove_account: "Xóa khỏi Ví Meteor",
          text_action_desc: "Hành động này sẽ xóa các tài khoản sau khỏi ví của bạn:",
        },
        sectionChangePassword: {
          text_password_changed_success: "Đã đổi mật khẩu thành công",
          text_change_password_warning:
            "Thao tác này sẽ thay đổi mật khẩu đăng nhập của bạn cho toàn bộ ví (tất cả tài khoản)",
          text_finish: "Kết thúc",
          text_change_password: "Đổi mật khẩu",
          text_create_password: "Tạo mật khẩu mới",
        },
        sectionCommunity: {
          text_thank_you: "Cảm ơn bạn đã chọn Ví Meteor!",
          text_follow_twitter: "Theo dõi Twitter",
          text_report_bug: "Tham gia Discord",
          text_join_discord: "Tham gia Discord",
          text_communityBlurb:
            "Chúng tôi muốn bạn là thành viên của cộng đồng ngày càng phát triển của chúng tôi- và lắng nghe suy nghĩ của bạn về những gì chúng tôi có thể làm để cải thiện.",
        },
        sectionAccessKey: {
          text_add_key: "Thêm khóa truy cập mới",
          text_edit_label: "Chỉnh sửa nhãn",
          text_revoke_access: "Thu hồi truy cập",
          text_revoke_access_key: "Thu hồi khóa truy cập",
          text_remove_key_desc:
            "Bạn có chắc chắn muốn xóa khóa truy cập này khỏi Tài khoản Near của mình không?",
          text_cancel: "Hủy bỏ",
          text_remove_key: "Xóa khóa",
          text_primary_key: "Khóa chính",
          text_hardware_key: "Khóa Phần Cứng",
          text_hardware_ledger_key: "Khóa Ledger",
          text_hd_path: "HD Path",
          text_public_key: "Khóa công khai",
          text_known_data: "Dữ liệu đã biết",
          text_private_key: "Khóa riêng",
          text_secret_phrase: "Cụm từ bí mật",
          text_unknown_to_meteor: "Không phát hiện được",
          text_access_key_warning_msg:
            "Đảm bảo rằng khóa truy cập này không được liên kết với bất kỳ phương thức khôi phục nào mà bạn vẫn muốn sử dụng! Chúng sẽ không hoạt động nữa.",
          text_access_key: "Khóa truy cập",
          text_add_key_subtitle: "Tạo hoặc thêm khóa truy cập cho ví này",
          text_access_key_label: "Nhãn phím truy cập",
          text_generate_new_key: "Tạo khóa mới",
          text_generate_new_key_desc: "Tạo khóa khôi phục cụm từ gốc mới cho ví này",
          text_clear_label: "Xóa nhãn",
        },
      },
      wallet: {
        max: "Tối đa",
        heading_walletLocked: "Ví bị khóa",
        button_unlockWallet: "Mở khóa ví",
        blurb_walletLocked: "Ví này hiện đang bị khóa. Cung cấp mật khẩu của bạn để mở khóa nó.",
        toast_heading_passwordIncorrect: "Mật khẩu không chính xác",
        toast_text_passwordIncorrect: "Không thể đăng nhập vào hồ sơ của bạn",
        settings: {
          settings: "Cài đặt",
          heading_settings: "Cài đặt ví",
          input_heading_extractSecret: "Xem cụm từ bí mật",
          input_text_extractSecret: "Trích xuất cụm từ bí mật của ví của bạn",
          input_heading_exportPrivateKey: "Xuất khóa cá nhân",
          input_heading_managePrivateKeys: "Quản lý khóa truy cập đầy đủ",
          input_text_managePrivateKeys: "Xem, gắn nhãn và đổi khóa riêng của bạn",
          input_text_exportPrivateKey: "Xuất khóa riêng của ví của bạn",
          input_heading_walletLabel: "Tên ví",
          input_text_walletLabel: "Nhập nhãn cho ví này",
          menu_heading_profile: "Hồ sơ",
          menu_text_profile: "Quản lý hồ sơ của bạn",
          menu_heading_connectedApps: "Ứng dụng được kết nối",
          menu_text_connectedApps: "Quản lý quyền truy cập ứng dụng vào ví của bạn",
          menu_heading_securityAndRecovery: "Bảo mật và Phục hồi",
          menu_text_securityAndRecovery: "Quản lý cụm từ bí mật và khóa cá nhân của ví của bạn",
          menu_heading_changePassword: "Đổi mật khẩu",
          menu_text_changePassword: "Thay đổi mật khẩu được sử dụng để mở khóa ví của bạn",
          menu_heading_RemoveWalletAccount: "Xoá tài khoản",
          menu_text_removeWalletAccount: "Xóa tài khoản này khỏi ví của bạn",
          common: {
            account_not_created_secret_note_1:
              "Tài khoản này chưa được tạo hoặc nhập (sử dụng Cụm từ bí mật) qua Ví Meteor, vì vậy hiện tại không có cụm từ bí mật được mã hóa nào",
            account_not_created_secret_note_2:
              "Hãy yên tâm, cụm từ bí mật ban đầu của bạn sẽ vẫn hoạt động như một phương thức khôi phục nếu bạn chưa xóa cụm từ đó khỏi tài khoản Near của mình",
            account_not_created_secret_note_3:
              "Chức năng xoay cụm từ bí mật của bạn trong Ví Meteor đang hoạt động!",
            enterPasswordBlurb: "Yêu cầu mật khẩu ví",
            enterPasswordCreateWalletBlurb: "Yêu cầu mật khẩu ví để thêm ví mới",
          },
          exportPrivateKey: {
            text_subheadingWarning:
              "Hãy thật cẩn thận nơi bạn lưu trữ hoặc chia sẻ khóa này. Bất kỳ ai có quyền truy cập đều có thể chiếm đoạt tài khoản ví này.",
            text_copiedToClipboard: "Đã sao chép khóa riêng",
          },
          manageAccessKeys: {
            input_text_accessKeyLabel: "Nhập nhãn cho Khóa truy cập này",
            button_updateLabel: "Cập nhật nhãn",
          },
        },
      },
      signIn: {
        welcome: "Chào mừng ",
        blurb: "Web phi tập trung đang đón chờ bạn...",
        button_unlock: "mở khóa",
        input_header_password: "Mở khóa bằng mật khẩu",
        text_forgot_password: "Quên mật khẩu?",
        toast_heading_passwordIncorrect: "Mật khẩu không đúng",
        toast_text_passwordIncorrect: "Không thể đăng nhập vào hồ sơ của bạn",
      },
      addWallet: {
        blurb: "Chọn cách bạn muốn thiết lập ví của mình",
        heading_meteorWallet: "Ví Meteor",
        button_import_wallet: "Nhập ví",
        button_subtext_import_wallet: "Nhập ví hiện tại của bạn bằng cụm từ gốc gồm 12 từ",
        button_create_new_wallet: "Tạo ví mới",
        button_subtext_create_new_wallet: "Thao tác này sẽ tạo một ví mới và cụm từ hạt giống",
        text_named_wallet: "Ví được đặt tên",
        text_named_wallet_desc: "Một tên tùy chỉnh mà bạn chọn",
        text_unavailable: "KHÔNG CÓ SẴN",
      },
      createNewWallet: {
        heading_newWallet: "Ví mới",
        please_insert_password: "Yêu cầu mật khẩu ví để thêm ví mới",
        p4_please_try_again: "Vui lòng thử lại",
        p4_unforunately_something_went_wrong:
          "Rất tiếc, đã xảy ra sự cố và chúng tôi không thể cấp tiền cho việc tạo ví của bạn. Bạn có thể tạo một ví tên dài và tài trợ cho việc tạo ví vào lúc này.",
        heading_newWalletChoice: "Sự lựa chọn là của bạn",
        subheading_newWalletChoice: "Bạn muốn tạo loại ví nào?",
        requires_initial_balance:
          "Yêu cầu số dư ban đầu là 0,1 NEAR để mở, được nạp tiền từ ví được kết nối trước đó",
        random_64_character: "Mã định danh 64 ký tự ngẫu nhiên",
        next: "Tiếp theo",
        traditional_crypto_wallet: "Ví tiền điện tử truyền thống",
        new_wallet: "Ví mới",
        available_near: "NEAR có sẵn",
        available_fund: "Có sẵn để tài trợ",
        initial_wallet_balance: "Số dư ban đầu trên Wallet",
        initial_wallet_balance_named_wallet:
          "Ít nhất 0,1 NEAR được yêu cầu làm số dư ban đầu khi tạo ví có tên tùy chỉnh",
        select_funding_wallet: "Chọn Ví tiền",
        no_account_selected: "Không có tài khoản được chọn",
        account_not_exist: "Tài khoản không tồn tại",
        not_enough_funds: "Không đủ tiền trong tài khoản",
        initial_funding_amount: "Số tiền tài trợ ban đầu",
        account_identity: "Danh tính tài khoản của bạn",
        account_identity_desc: "Bạn muốn địa chỉ ví Near tùy chỉnh của mình là gì?",
        is_available: "có sẵn",
        username_is_available: "Xin chúc mừng. Tên người dùng của bạn hợp lệ",
        account_already_exists: "Tên tài khoản đã tồn tại",
        account_not_compatible: "Tên tài khoản không tương thích",
        account_can_contain: "ID tài khoản của bạn có thể chứa bất kỳ nội dung nào sau đây",
        lowercase_characters: "Ký tự chữ thường",
        digits: "chữ số",
        character_requirement: "Các ký tự (_-) có thể được sử dụng làm dấu phân cách",
        account_cannot_contain: "ID tài khoản của bạn KHÔNG THỂ chứa",
        character_dot: 'Ký tự "@" hoặc "."',
        more_than_64_characters: "Hơn 64 ký tự (bao gồm cả .",
        fewer_than_2_characters: "Ít hơn 2 ký tự",
        explore_web3: "Khám phá Web3",
        step_into_future: "Bước vào tương lai cùng Meteor",
        generateNew: "Tạo mới",
        claimIdentity: "Xác nhận danh tính của bạn",
        button_create_with_ledger: "Tạo với Ledger",
        extensionCreate: {
          title: "Tạo Ví Đã Bị Vô Hiệu Hóa",
          description:
            "Việc tạo tài khoản tạm thời đã bị vô hiệu hóa trên tiện ích mở rộng. Vui lòng tạo ví của bạn trên ví web, sau đó nhập nó vào tiện ích mở rộng.",
          button_import: "Nhập một ví hiện có",
          button_open_web_wallet: "Mở Ví Trên Web",
        },
      },
      gettingStarted: {
        button_getStarted: "Bắt đầu",
        welcomeToMeteor: "Chào mừng đến với Meteor",
        blurb: "Lưu trữ và stake an toàn token NEAR và tài sản tương thích của bạn với Meteor.",
      },
      createPassword: {
        buttons: {
          continue: "Tiếp tục",
        },
        agreeToTerms: (link) => (
          <>
            Tôi đồng ý{" "}
            <Link colorScheme={"brandPrimary"} fontWeight={600} href={link} isExternal>
              Điều khoản dịch vụ
            </Link>
          </>
        ),
        heading: "Tạo mật khẩu",
        blurb: "Bạn sẽ sử dụng mật khẩu này để mở khóa ví của mình",
        placeholders: {
          enterPassword: "Nhập mật khẩu",
          confirmPassword: "Xác nhận mật khẩu",
        },
        validation: {
          atLeast8: "Ít nhất 8 ký tự",
          doNotMatch: "Mất khẩu không hợp lệ",
          strengthTooWeak: "Quá yếu",
          strengthWeak: "Yếu",
          strengthMedium: "Vừa phải",
          strengthStrong: "Mạnh",
        },
      },
      recoveryPhrase: {
        heading: "Ghi nhớ bí mật",
        blurb:
          "Lưu 12 từ này vào trình quản lý mật khẩu hoặc viết chúng ra giấy và cất ở nơi an toàn. Không chia sẻ với bất cứ ai. Nếu bạn làm mất mật khẩu này thì bạn sẽ không thể truy cập vào ví được nữa",
        confirmSavedPhrase: "Tôi đã lưu Cụm từ khôi phục bí mật của mình",
        buttons: {
          continue: "Tiếp tục",
          copy: "Sao chép",
          generateNew: "Tạo mới",
        },
        toasts: {
          copiedToClipboard: "Sao chép vào clipboard",
        },
      },
      seedPhraseConfirmation: {
        buttons: {
          confirm: "xác nhận",
        },
        wordForFirst: "Từ đầu tiên",
        wordForLast: "Từ cuối cùng",
        heading: "Bạn đã lưu nó chưa?",
        blurb:
          "Xác minh rằng bạn đã lưu bản ghi nhớ của mình bằng cách nhấp vào từ đầu tiên (1) và từ cuối cùng (12).",
        confirmationWrongHeading: "Phục hồi cụm từ không chính xác",
        confirmationWrongBlurb:
          "Đảm bảo rằng bạn đã lưu cụm từ này ở nơi an toàn và có thể lấy lại khi cần",
        profilePasswordMismatchHeading: "Sai mật khẩu",
        profilePasswordMismatchBlurb: "Mật khẩu hiện tại không khớp với mật khẩu được cung cấp",
      },
      accountSuccess: {
        heading: "Kết thúc!",
        blurb:
          "Hãy chú ý cập nhật sản phẩm, nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi",
        followUsOnTwitter: "Theo dõi chúng tôi trên Twitter (X)",
        joinDiscord: "Nhận trợ giúp về Discord",
        button_finish: "Kết thúc",
        button_redirect: "Truy cập vào URL",
        toast_title: "Tạo tài khoản thành công",
        toast_title_with_redirect:
          "Tạo tài khoản thành công, bạn sẽ được chuyển hướng trở lại ứng dụng trong giây lát.",
        toast_redirect_whitelisted_failed:
          "Liên kết chuyển hướng này chưa được phê duyệt để chuyển hướng",
      },
      transactions: {
        heading_history: "Lịch sử",
        badgeStatus: {
          [ETransactionBadgeStatus.SUCCEED]: "THÀNH CÔNG",
          [ETransactionBadgeStatus.FAILED]: "THẤT ​​BẠI",
          [ETransactionBadgeStatus.LOADING]: "ĐANG TẢI",
          [ETransactionBadgeStatus.PROCESSING]: "ĐANG XỬ LÝ",
          [ETransactionBadgeStatus.WAITING]: "ĐANG ĐỢI",
          [ETransactionBadgeStatus.UNKNOWN]: "KHÔNG XÁC ĐỊNH",
        },
        common: {
          call: "CALL",
          status: {
            success: "THÀNH CÔNG",
            failed: "THẤT BẠI",
            unknown: "Không xác định",
          },
        },
        loadingBottom: {
          more: "Tải thêm",
          loading: "Đang tải",
          end: "Không có gì ở đây",
          endTransaction90Days: "Không có thêm giao dịch nào trong 90 ngày qua",
        },
        typeName: {
          receive: "Nhận",
          self: "Tự gọi",
          with: "Với",
          unknown: "Khác",
        },
        direction: {
          from: "từ",
          to: "đến",
          with: "với",
        },

        accessKey: {
          addKey: "{key} thêm.",
          deleteKey: "A {key} đã xóa.",
          key: "Khóa",
          permissionTypes: {
            [ENearIndexer_AccessKeyPermission.FULL_ACCESS]: "Khóa truy cập đầy đủ",
            [ENearIndexer_AccessKeyPermission.FUNCTION_CALL]: "Gọi hàm",
          },
          publicKey: "Khóa công khai",
          receiverId: "Hợp đồng đã được ủy quyền",
          allowMethodNames: "Phương pháp được phép",
          emptyMethodNames: "Bất kỳ phương thức",
          allowance: "Số tiền cho phép",
        },

        account: {
          createTitle: "Tạo tài khoản",
          createdMessage: "Tài khoản đã được tạo {account_id}.",
          deletedMessage: "Tài khoản đã bị xóa {account_id}.",
          publicKey: "Khóa công khai",
          byId: "Theo tài khoản",
          deposit: "Nạp",
          beneficiaryId: "Số dư được chuyển tới",
        },

        deploy: {
          code: "Code",
          message: "Bạn đã triển khai {code} cho {contract}.",
        },

        functionCall: {
          brief: "Đã gọi {method_name} trên {receiver}",
          details: "Được gọi là phương thức {method_name} trên hợp đồng {receiver}.",
          cost: "Giới hạn gas:",
          deposit: "Nạp:",
          args: "Tham số:",
        },

        details: {
          transactionHash: "Mã hash của giao dịch",
          includedInBlockHash: "block hash",
          includedInChunkHash: "chunk hash",
          blockTimestamp: "Thời gian ký",
          signerAccountId: "Người ký",
          signerPublicKey: "Khóa công khai",
          receiverAccountId: "Người nhận",
          convertedIntoReceiptId: "Biên nhận",
          receiptConversionBurnt: "Gas",
          moreInformation: "Thêm thông tin",
          lessInformation: "Ít thông tin hơn",
          action: "hành động",
          viewExplorer: "Xem Trên Trình khám phá",
        },
        custom: {
          ftSwap: {
            title: "Hoán đổi token",
            near: "hoán đổi NEAR",
          },
          nftTrade: {
            direction: {
              [ENftOfferDir.TO_YOU]: "cho bạn",
              [ENftOfferDir.FROM_YOU]: "từ bạn",
            },
          },
        },
      },
      nftCollection: {
        heading_nft: "Bộ sưu tập của tôi",
        nothing: "Bạn chưa có NFT nào.",
        total_nfts: "Tổng số NFT",
        total_floor_price: "Tổng giá sàn",
        total_floor: "Tổng số sàn",
        floor_price: "Giá sàn",
        contract: "Hợp đồng",
      },
      nftDetails: {
        button_send: "Gửi",
        button_explorer: "Trình khám phá",
        button_view: "Lượt xem",
        heading_description: "Mô tả",
        heading_properties: "Đặc tính",
      },
      execution: {
        step: "Bước",
        of: "của",
        transaction_hash: "Hash Giao dịch",
        button_finish: "Hoàn thành",
        title: "Thực hiện Giao dịch",
        checking: "Đang kiểm tra",
        transaction_execution_status: {
          [ETransactionExecutionStatus.awaiting_signer]: "Đang chờ người ký",
          [ETransactionExecutionStatus.failed]: "Thất bại",
          [ETransactionExecutionStatus.pending_signing]: "Đang chờ ký",
          [ETransactionExecutionStatus.publishing]: "Đang xuất bản",
          [ETransactionExecutionStatus.signed]: "Đã ký",
          [ETransactionExecutionStatus.success]: "Thành công",
        },
      },
      ledger: {
        title: "Thiết bị Ledger",
        connected: "Đã kết nối",
        button_try_again: "Thử lại",
        ledger_device_alert: {
          [ELedgerConnectionStatus.connected]: {},
          [ELedgerConnectionStatus.disconnected]: {},
        },
        functionality_not_supported: "Chức năng này chưa được hỗ trợ trên thiết bị Ledger.",
      },
    },
  } as DeepPartial<ITranslations>,
  translation_en,
);
