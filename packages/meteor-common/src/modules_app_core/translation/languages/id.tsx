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

export const translation_id: ITranslations = _.defaultsDeep(
  {
    languageDisplayName: "Bahasa Indonesia",
    languageCode: "id",
    bridge: {
      button_view_transaction: "Lihat Transaksi",
      intent_pending: {
        title: "Transfer Jembatan Sedang Berlangsung",
        description:
          "Anda memiliki transaksi jembatan yang sedang berlangsung. Apakah Anda ingin melanjutkan atau membuat yang baru?",
        button_create_new_bridge: "Buat Jembatan Baru",
      },
      warning_no_more_transactions: "Tidak ada transaksi lebih lanjut",
      warning_old_bridge:
        "Jembatan sedang beralih menggunakan Intents NEAR. Klik di sini untuk melihat transaksi Jembatan lama Anda.",
      transitioning_to_intents:
        "Jembatan sedang beralih ke penggunaan Near Intents. Klik di sini untuk melihat jembatan Near Intents.",
      warning_insufficient_balance: "Saldo tidak mencukupi",
      modal_add_public_key: {
        title: "Siap Menggunakan Intents NEAR?",
        description:
          "Tambahkan kunci publik satu kali untuk mengaktifkan Intents NEAR dan memulai transaksi Anda.",
      },
      modal_terminate_bridge: {
        title: "Batalkan Jembatan",
        description:
          "Apakah Anda yakin ingin menghentikan proses jembatan saat ini? Anda dapat membuat yang baru kapan saja.",
      },
      modal_available_balance: {
        title: "Lanjutkan dengan Saldo Tersedia",
        description:
          "Anda memiliki saldo tersedia di jembatan, yang akan digunakan untuk memproses transaksi ini.",
      },
      modal_similar_pair: {
        title: "Transfer Jembatan Sedang Berlangsung",
        description:
          "Anda memiliki transaksi jembatan yang sedang berlangsung. Apakah Anda ingin membuat yang baru?",
        button_create_new: "Buat Baru",
        button_back: "Kembali",
        footer_note:
          "Membuat jembatan baru akan membatalkan transaksi sebelumnya dan mengembalikan dana yang disetorkan.",
      },
      modal_refund: {
        title: "Pengembalian Dana",
        label_network: "Jaringan",
        label_insert_address: "Masukkan alamat dompet untuk menerima pengembalian dana",
        placeholder_insert_address: "Silakan masukkan alamat dompet",
        label_insert_address_confirm: "Konfirmasi alamat dompet",
        placeholder_insert_address_confirm: "Silakan masukkan alamat dompet lagi",
        error_invalid_address: "Alamat dompet tidak valid",
        error_address_not_match: "Alamat dompet tidak cocok",
      },
      button_cancel: "Batal",
      button_proceed: "Lanjutkan",
      label_reference_id: "ID Referensi",
      label_status: "Status",
      label_refund_destination: "Tujuan Pengembalian Dana",
      label_source_network: "Jaringan Sumber",
      label_destination_network: "Jaringan Tujuan",
      label_source_token: "Token Sumber",
      label_destination_token: "Token Tujuan",
      label_amount_from: "Jumlah Dari",
      label_amount_to: "Jumlah Ke",
      label_refund_hash: "Hash Pengembalian Dana",
      label_withdrawal_hash: "Hash Penarikan",
      label_created_at: "Dibuat Pada",
      quote_result: {
        success: {
          title: "Jembatan Berhasil",
          description:
            "Aset Anda telah berhasil dipindahkan dan sekarang tersedia di jaringan tujuan.",
        },
        fail: {
          title: "Jembatan Gagal",
          description:
            "Transfer aset Anda tidak dapat diselesaikan. Silakan periksa detail jaringan dan coba lagi, atau hubungi dukungan jika masalah berlanjut.",
        },
        cancel: {
          title: "Jembatan Dibatalkan",
          description: "Transaksi jembatan telah dibatalkan.",
        },
      },
      button_refund: "Pengembalian Dana",
      button_continue: "Lanjutkan",
      button_view: "Lihat",
      label_transaction_processing: "Pemrosesan Transaksi",
      label_footnote_come_back_later:
        "Anda dapat menutup halaman ini dengan aman dan kembali nanti",
      button_confirm_quote: "Konfirmasi Kutipan",
      warning_large_withdrawal:
        "Penarikan lebih dari ~5,000$ mungkin memerlukan waktu lebih lama untuk diproses.",
      quote_header: {
        deposit: {
          title: "Langkah 1 : Deposit",
          subtitle:
            "Anda dapat menutup halaman ini dengan aman setelah deposit, karena mungkin memerlukan waktu untuk diproses.",
        },
        confirm_quote: {
          title: "Langkah 2 : Konfirmasi Kutipan",
          subtitle:
            "Anda dapat menutup halaman ini dengan aman setelah deposit, karena mungkin memerlukan waktu untuk diproses.",
        },
        steps: {
          deposit: "Deposit",
          confirm_quote: "Konfirmasi Kutipan",
          complete: "Selesai",
        },
      },
      label_deposit_amout: "Jumlah Deposit",
      label_deposit_network: "Jaringan Deposit",
      label_deposit_address: "Alamat Deposit",
      warning_deposit_address_title: "Harap perhatikan hal berikut:",
      warning_deposit_address_desc_1: "Jangan menyetor aset digital lain kecuali",
      warning_deposit_address_desc_2: "di",
      warning_deposit_address_desc_3: "ke alamat di atas.",
      title: "Jembatan",
      label_pay: "Bayar",
      label_receive: "Terima",
      label_from: "Dari",
      label_to: "Ke",
      label_you_send: "Anda Mengirim",
      label_you_receive: "Anda Menerima (EST.)",
      label_on_network: "Di Jaringan",
      button_review_bridge: "Tinjau Jembatan",
      button_confirm_bridge: "Konfirmasi Jembatan",
      label_bridge_details: "Detail Jembatan",
      label_bridge_compare: "Bandingkan tarif di antara penyedia",
      label_support_fees:
        "Jumlah yang Anda terima mungkin bervariasi karena fluktuasi pasar. Mengirim transaksi dengan cepat akan membantu memastikan tetap mendekati tarif yang dikutip.",
      label_fees: "Biaya",
      label_slippage: "Selip",
      label_on: "Di",
      button_change: "Ubah",
      button_add_sender_address: "Tambahkan Alamat Pengirim",
      button_add_receiver_address: "Tambahkan Alamat Penerima",
      modals: {
        network_token_selector: {
          label_select_network: "Pilih Jaringan",
          label_select_token: "Pilih Token",
          hint_search_network: "Cari Jaringan",
          hint_search_token: "Cari Token",
        },
        input_chain_address: {
          label_sender_address: "Alamat Pengirim",
          label_receiver_address: "Alamat Penerima",
          description: "Masukkan meme di sini *kedip*",
          button_confirm: "Konfirmasi",
        },
        tnc: {
          tnc: "Syarat dan Ketentuan",
          rate_variability: "Variabilitas Tarif:",
          rate_variability_desc:
            "Tarif yang dikutip dapat berfluktuasi berdasarkan tarif pasar waktu nyata. Semakin lama transaksi memakan waktu untuk selesai, semakin besar kemungkinan jumlah akhir yang diterima dapat bervariasi dari kutipan awal.",
          third_party_responsibility: "Tanggung Jawab Pihak Ketiga:",
          third_party_responsibility_desc:
            "Layanan jembatan difasilitasi oleh mitra pihak ketiga. Meteor Wallet hanya membantu dalam menemukan rute terbaik dan tidak bertanggung jawab atas kehilangan atau kegagalan jika mitra tidak memenuhi kewajiban mereka.",
          disclaimer: "Penafian:",
          disclaimer_desc:
            "Dengan menggunakan layanan jembatan, Anda mengakui bahwa Meteor Wallet tidak dapat menjamin keandalan atau integritas mitra pihak ketiga. Semua masalah atau perselisihan terkait jembatan harus diselesaikan dengan mitra terkait.",
          citizenship: "Pembatasan Kewarganegaraan Pengguna:",
          citizenship_desc:
            "Sesuai dengan Ketentuan Penggunaan kami, pengguna dari Amerika Serikat, India, Singapura, dan negara-negara yang dikenakan sanksi oleh Perserikatan Bangsa-Bangsa tidak diperbolehkan menggunakan layanan ini.",
          confirm_citizenship:
            "Saya mengonfirmasi bahwa saya bukan warga negara Amerika Serikat, India, Singapura, atau negara mana pun yang disanksi oleh Perserikatan Bangsa-Bangsa yang dilarang menggunakan layanan ini.",
          agree_tnc: "Saya memahami & menyetujui S&K",
          hide_tnc: "Sembunyikan pesan ini di masa mendatang",
          agree: "Setuju",
        },
      },
      label_bridge_history: "Riwayat Jembatan",
      label_total_records: "Total {count} Catatan",
      button_recheck: "Periksa Ulang",
      label_swapped: "Jembatani",
      title_slippage: "Pengaturan Selip",
      desc_slippage:
        "Transaksi Anda akan gagal jika harga berubah lebih dari selip. Nilai yang terlalu tinggi akan mengakibatkan perdagangan yang tidak menguntungkan.",
      button_confirm: "Konfirmasi",
      hint_bridge_result:
        "Harap dicatat bahwa Anda selalu dapat memeriksa riwayat transaksi Anda di halaman riwayat jembatan.",
      label_bridge: "Jembatan",
      label_success: "Berhasil",
      label_failed: "Gagal",
      label_cancelled: "Dibatalkan",
      label_pending: "Menunggu",
      label_refunded: "Dikembalikan",
      label_transaction_created: "Menunggu Pembayaran",
      payment_processing: "Pemrosesan Pembayaran",
      desc_bridge_success:
        "Pesanan jembatan Anda telah dibuat dan dibayar. Aset yang dijembatani/ditukar sedang dikonfirmasi dan akan segera ditransfer kepada Anda. Proses ini biasanya memakan waktu 10-20 menit.",
      desc_bridge_failed:
        "Transfer aset Anda tidak dapat diselesaikan. Harap verifikasi detail jaringan dan coba lagi, atau hubungi dukungan jika masalah berlanjut.",
      desc_bridge_created:
        "Pesanan Anda telah dibuat. Anda akan diarahkan ke halaman pembayaran untuk menyelesaikan pembayaran dalam 300 detik. Jika Anda tidak diarahkan secara otomatis, silakan klik tombol di bawah ini.",
      button_back_to_wallet: "Kembali ke Dompet",
      button_check_transaction_status: "Periksa Status Transaksi",
      button_redirect_to_payment: "Alihkan ke Pembayaran",
      label_seconds: "detik",
      meteor_derived_status: {
        failed_deposit: "Gagal",
        pending: "Tertunda",
        processing: "Sedang diproses",
        success: "Berhasil",
        timeout: "Waktu habis",
        refunded: "Dikembalikan",
      },
      label_please_add_wallet_address: "Harap tambahkan alamat dompet",
      label_no_route: "Tidak ada rute",
      label_network_not_supported: "{network} tidak didukung",
      warning_no_network_found:
        "Tidak ada jaringan yang ditemukan. Silakan coba kata kunci lain atau periksa ejaannya.",
      warning_no_token_found:
        "Tidak ada token yang ditemukan. Silakan coba kata kunci lain atau periksa ejaannya.",
    },
    error: {
      title_1: "Ups!",
      title_2: "Ada yang salah",
      description:
        "Ada yang salah. Kami sedang menyelidikinya, dan laporan Anda akan membantu kami mengatasi masalah ini lebih cepat.",
      button_contact_support_now: "Hubungi Dukungan Sekarang",
      button_back_to_wallet: "Kembali ke Dompet",
    },
    campaign: {
      label_voting_has_ended: "Pemungutan suara telah berakhir",
      what_is_new: {
        "3": {
          description:
            "Referensikan teman-teman ke Harvest Moon dan menangkan bagian Anda dari $5.000!",
        },
        "4": {
          description: "Penurunan Token Baru! Referensikan teman dan menangkan bagian dari $3.500!",
        },
        "5": {
          description: "Taruhkan xRef selama seminggu dan bagikan $2500!",
        },
        "6": {
          description:
            "Jembatan antar jaringan kini menjadi SEDERHANA, CEPAT, MURAH, dan AMAN. Coba sekarang!",
        },
        "7": {
          description:
            "MISIL KILAT! Vote dengan $GEAR di Musim Meme 7 untuk mendapatkan bagian dari $50K!",
        },
        "8": {
          description: "Misi Beruntun Telah Dimulai! Ikuti Misi Harian untuk Hadiah Ekstra!",
        },
        "9": {
          description:
            "Hadiah $25K! Bergabunglah dengan Kompetisi Perdagangan NEAR Memecoin Hari Ini!",
        },
        "10": {
          description:
            "Bergabunglah dengan komunitas Meteor dan jadilah salah satu orang pertama yang menikmati DeFi Mastercard eksklusif kami",
        },
        "11": {
          description: "Musim Meme 8 telah tiba, pilih GEAR dan klaim hadiah menarik!",
        },
        "13": {
          description: "Musim Meme 9 telah tiba, pilih GEAR dan klaim hadiah menarik!",
        },
        "14": {
          description: "Musim Meme 10 telah tiba, pilih GEAR dan klaim hadiah menarik!",
        },
      },
      meme_phase_2: {
        my_staked_gear: "GEAR Saya yang Dipertaruhkan",
        estimated_apy: "APY Perkiraan",
        ref_meme_contest_phase_2: "Kontes Meme Refase 2",
        gear_top_5_voted_meme_token_stake_to_earn_rewards:
          "GEAR sekarang menjadi salah satu dari 5 token memeatas yang dipilih. Taruhkan GEAR untuk mendapatkan hadiah.",
        meme_season_phase_2_stake_gear_to_earn: "Taruhkan $GEAR dan dapatkan hingga 40% APY",
        staking_apy: "APY Staking",
        stake_at_least_100_gear_for_advanced_contract:
          "Taruhkan setidaknya 100 GEAR untuk mendapatkan kontrak lanjutan. Periode pembukaan kunci 5 hari berlaku.",
        step_1: {
          title: "Langkah 1: Beli GEAR",
          description: "Untuk memulai, beli GEAR jika Anda belum memiliki cukup untuk staking.",
          input_title: "Jumlah untuk Dibeli",
          input_button: "Beli",
        },
        step_2: {
          title: "Langkah 2: Taruhkan GEAR untuk Hadiah",
          description:
            "Taruhkan setidaknya 100 GEAR untuk mendapatkan kontrak lanjutan. Periode pembukaan kunci 5 hari berlaku.",
          input_title: "Jumlah untuk Dipertaruhkan",
          input_button: "Taruhkan",
          warning_success: "Staking GEAR Berhasil",
        },
      },
      claim_successfully: "Berhasil diklaim",
      claim_reward_successfully: "Anda telah berhasil mengklaim hadiah Anda",
      raffle_rewards: "Hadiah Undian",
      unstake_open_date_time_6th_sept: "Unstake akan dibuka pada 6 September pukul 12 siang UTC.",
      unstake_open_date_time_7th_sept: "Unstake akan dibuka pada 7 September pukul 12 siang UTC.",
      reward_open_date_time: "Hadiah akan diberikan pada 6 September",
      raffle_result_announcement_date_time:
        "Hasil undian akan diumumkan pada 7 September pukul 12 siang UTC.",
      stake_and_vote: "Taruhkan & Pilih",
      unstake: "Unstake",
      my_rewards: "Hadiah Saya",
      raffle_ticket: "Tiket Undian",
      label_campaign_details: "Detail Kampanye",
      rewards: {
        title: "Hadiah Partisipasi",
        my_raffle_tickets: "Tiket Undian Saya",
        potential_rewards: "Hadiah Potensial",
        raffle_ticket_for_each_xref_voted: "Tiket Undian untuk setiap xRef yang Dipilih",
        label_for_participating: "untuk berpartisipasi",
        label_for_each_vote: "untuk setiap xREF yang dipilih",
        reward_gear: "hingga $2500 GEAR akan didistribusikan secara acak melalui undian",
        reward_usd:
          "Bagikan kumpulan hadiah $40K tergantung pada seberapa kuat suara komunitas kita!",
        token_drop: "Distribusi Token",
        worth_of_gear_drops: "Nilai dari Distribusi $GEAR",
        voting_period: "Periode Pemungutan Suara: Hingga 5 Oktober, UTC 00:00",
        snapshot_period: "Snapshot: 6 Oktober (Unstake sebelum ini tidak akan dihitung)",
        unstaking_available: "Unstaking: Tersedia pada 6 Oktober",
      },
      label_rare_relics: "Relik Langka",
      hours: "Jam",
      minutes: "Menit",
      left: "Tersisa",
      label_ref_contest: "Kontes Ref",
      label_ref_meme_contest: "Kontes Meme Ref - Fase 1",
      label_ref_meme_season: "Ref MEME Musim 6 - Fase 1",
      description_ref_meme_contest:
        "Ikuti Kontes Meme Ref dan dapatkan hadiah untuk mendukung komunitas Meteor dan $GEAR!",
      description_ref_meme_season:
        "Ikuti Kontes Ref MEME dan dapatkan hadiah untuk komunitas Meteor dan $GEAR! Setiap suara mendapatkan tiket undian untuk hadiah eksklusif dan kesempatan memenangkan bagian dari kumpulan hadiah $40K—dengan lebih banyak hadiah saat suara kami bertambah!",
      label_how_to_participate: "Cara berpartisipasi",
      label_get_guaranteed_reward: "Dapatkan Kontrak Lanjutan yang Dijamin",
      label_stand_a_chance_to_win: "Dapatkan kesempatan untuk menang",
      label_my_entry: "Partisipasi Saya",
      text_campaign: "Musim meme sedang berlangsung, berpartisipasilah untuk memenangkan hadiah.",
      label_milestone: "Tonggak",
      label_votes_casted: "Suara yang Diberikan",
      step_1: {
        title: "Langkah 1: Beli Ref",
        description: "Anda membutuhkan REF untuk berpartisipasi dalam kontes MEME dan staking xREF",
        input_title: "Jumlah untuk Dibeli",
        input_button: "Beli",
      },
      step_2: {
        title: "Langkah 2: Taruhkan Ref untuk xRef",
        description: "Token xREF memberi Anda kekuatan suara dan Anda saat ini memiliki",
        input_title: "Jumlah untuk Dipertaruhkan",
        input_button: "Taruhkan",
        warning_success: "Staking xRef Berhasil",
      },
      step_3: {
        title: "Langkah 3: Pilih Gear",
        description: "Setiap suara memberi Anda tiket undian dan Anda saat ini memiliki",
        input_title: "Jumlah untuk Dipilih",
        input_button: "Pilih",
        warning_success: "Memilih GEAR berhasil",
      },
      step_unstake_xref_token: {
        title: "Unstake Token xRef",
        description:
          "Harap dicatat bahwa akan ada periode penguncian ~{LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} jam",
        label_locking_period: "Periode Penguncian",
        label_total_staked_amount: "Jumlah yang Dipertaruhkan",
        input_title: "Jumlah untuk Diunstake",
        input_button: "Unstake",
        warning_unstake_success: "Unstake xRef Berhasil",
        warning_withdraw_success: "Penarikan xRef Berhasil",
        description_unstaking:
          "Anda sedang mengunstake {balanceUnstaking} Token xRef. Ini biasanya memakan waktu {LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} jam untuk selesai",
        description_claimReady:
          "Anda memiliki {balanceClaimReady} Token xRef yang siap untuk diklaim, klik untuk mengklaim sekarang",
      },
      step_unstake_ref_token: {
        title: "Unstake Token Ref",
        description: "Unstake instan tersedia untuk Token Ref. Anda dapat unstake kapan saja",
        label_total_staked_amount: "Jumlah Total yang Dipertaruhkan",
        input_title: "Jumlah untuk Unstake",
        input_button: "Unstake",
        warning_unstake_success: "Unstake Token Ref Berhasil",
      },
      step_unstake_gear_token: {
        title: "Unstake Token GEAR",
        description:
          "Harap dicatat bahwa akan ada periode penguncian ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} hari",
        label_locking_period: "Periode Penguncian",
        label_total_staked_amount: "Jumlah yang Dipertaruhkan",
        input_title: "Jumlah untuk Diunstake",
        input_button: "Unstake",
        warning_unstake_success: "Unstake GEAR Berhasil",
        warning_withdraw_success: "Penarikan GEAR Berhasil",
        description_unstaking:
          "Anda sedang mengunstake {balanceUnstaking} Token GEAR. Ini biasanya memakan waktu ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} hari untuk selesai",
        description_claimReady:
          "Anda memiliki {balanceClaimReady} Token GEAR yang siap untuk diklaim, klik untuk mengklaim sekarang",
        label_lock_up_period: "Periode Penguncian",
        label_days: "Hari",
        label_apy: "APY",
      },
      label_you_have_gear: "Anda memiliki {prettyGearBalance} GEAR",
      label_reward_details: "Detail Hadiah",
      label_participation_reward: "Hadiah Partisipasi",
      description_participation_reward: "Hadiah saat Anda berpartisipasi dalam kontes ini",
      label_milestone_reward: "Hadiah Tonggak",
      description_milestone_reward:
        "Setiap tonggak menambahkan lebih banyak item ke kolam undian. Setiap tiket undian memberi Anda kesempatan untuk memenangkan hadiah.",
      label_my_raffle_tickets: "Tiket Undian Saya",
      label_raffle_rewards_in_milestone: "Hadiah Undian dalam Tonggak",
      label_when_total_ticket_reached: "Ketika Total Tiket Tercapai",
      label_dont_see_your_raffle_ticket: "Tidak menerima tiket undian Anda? Periksa",
      label_dont_see_your_rewards: "Tidak menerima hadiah Anda? Periksa",
      label_here: "di sini",
      title_claim_raffle_ticket: "Klaim Tiket Undian",
      description_claim_raffle_ticket:
        "Temukan hash transaksi yang terkait dengan pemungutan suara untuk GEAR",
      label_input_transaction_hash: "Masukkan hash transaksi",
      warning_claim_raffle_ticket_success: "Klaim Tiket Undian Berhasil",
      button_claim: "Klaim",
      button_claimed: "Diklaim",
      label_coming_soon: "Segera Hadir",
      label_staking_rewards: "Hadiah Staking",
      label_list_of_registered_entries: "Daftar Entri Terdaftar",
      label_no_registered_entries: "Tidak ada entri terdaftar",
      button_dropped: "Dijatuhkan",
      label_you_didnt_win: "Anda tidak memenangkan hadiah undian apa pun",
      label_coming_soon_unstaking: "Unstaking akan tersedia pada 6 Oktober",
      label_coming_soon_raffle: "Hadiah undian akan tersedia pada 6 Oktober",
    },
    rpc_rotate_modal: {
      rotating_rpc: "RPC yang dipilih sedang tidak berfungsi — ganti sekarang.",
      selected_rpc_not_working_change_to_other:
        "RPC yang dipilih saat ini tidak berfungsi sebagaimana mestinya. Kami merekomendasikan untuk menggantinya dengan {rpcName}.",
      change_now: "Ganti Sekarang",
      all_rpc_down:
        "Protokol NEAR mengalami masalah jaringan, menyebabkan semua RPC sementara tidak tersedia. Transaksi mungkin tertunda, dan beberapa fitur mungkin tidak berfungsi.",
    },
    configure_rpc: {
      title: "Pemilih RPC",
      description: "Mengubah jaringan RPC akan menyegarkan aplikasi",
      button_add_rpc: "Tambah RPC",
      warning_success_update_rpc: "Anda telah berhasil mengubah penyedia RPC Anda ke {rpc}",
      warning_rpc_abnormal_ping:
        "Ping RPC tidak normal, kami menyarankan untuk mengganti ke RPC lain.",
      warning_duplicate_entry: "Terdeteksi entri RPC duplikat.",
      label_add_custom_network: "Tambahkan Jaringan Kustom",
      label_network_name: "Nama Jaringan",
      label_rpc_url: "URL RPC",
      button_add: "Tambah",
      button_confirm_change_rpc: "Konfirmasi",
      rpcNames: {
        mainnet: {
          official: "RPC Resmi",
          meteor: "RPC Meteor FastNear",
          fastnear: "RPC FastNear",
          pagoda: "RPC Pagoda",
          lava: "RPC Lava",
          shitzu: "RPC Shitzu",
        },
        testnet: {
          official: "RPC Resmi testnet",
          fastnear: "RPC FastNear testnet",
          pagoda: "RPC Pagoda testnet",
          lava: "RPC Lava testnet",
        },
      },
      warning_changed_network: "Jaringan diubah ke {network}",
      hint_switch_network: "Tekan CTRL + . untuk beralih cepat antara jaringan",
    },
    wallet_status: {
      "": "",
      account_exists: "Anda dapat mengubah perujuk Anda ke akun ini",
      account_no_exists: "Dompet tidak ada",
      new_referrer_same_as_old_referrer:
        "Perujuk tidak valid: Perujuk baru tidak boleh sama dengan perujuk lama.",
      current_lab_level_exceed_1:
        "Kesalahan: Anda sudah memperbarui lab Anda dan tidak dapat mengubah perujuk Anda lagi.",
      new_referrer_harvest_moon_not_init:
        "Perujuk tidak valid: Perujuk belum menginisialisasi akun bulan panen.",
      new_referrer_not_tg_linked:
        "Perujuk tidak valid: Perujuk harus menjadi dompet utama yang diverifikasi oleh Telegram.",
      new_referrer_must_be_primary_wallet:
        "Perujuk tidak valid: Perujuk harus menjadi dompet utama yang diverifikasi oleh Telegram.",
      "responder_production_rate_exceed_0.1": "Kesalahan: Tingkat produksi Anda melebihi 0,1",
      error_checking: "Kesalahan: Terjadi kesalahan, silakan coba lagi nanti.",
    },
    changelog: {
      abuse: {
        title_1: "Pembaruan Penting",
        title_2: "Mengenai Akun Harvest Moon Anda",
        text_1: "Karena bug terbaru di Moon Exchange, Anda menerima",
        text_2: "dengan diskon 50% sebelum bug diperbaiki pada",
        text_3: "Untuk memastikan keadilan, kami telah menghapus item berikut dari akun Anda",
        text_4: "Sebagai kompensasi atas ketidaknyamanan ini, kami memberi Anda 1 Kontrak Ahli.",
        text_5:
          "Untuk informasi lebih lanjut, silakan klik tombol Pelajari Lebih Lanjut di bawah ini.",
        text_6:
          "Dengan mencentang, Anda mengonfirmasi bahwa Anda telah membaca dan memahami pembaruan tersebut.",
        label_contracts: "Kontrak",
        button_view_transaction: "(Lihat Transaksi)",
        button_learn_more: "Pelajari Lebih Lanjut",
        button_understood: "Mengerti",
      },
      label_whats_new: "Apa yang Baru :",
      close: "Tutup",
      "15": {
        title: "MEME MEMASAK",
        description_1:
          "Peluncuran adil pertama dari jenisnya sekarang tayang di Near Protocol. Ikuti sekarang dalam",
        description_2: "kampanye perdagangan mereka!",
        button: "Masak Sekarang",
      },
      "16": {
        title: "IMPOR TOKEN",
        description:
          'Tidak melihat saldo token Anda? Impor sekarang di bagian bawah "Aset Saya" di halaman utama',
        button: "Periksa sekarang",
      },
      "17": {
        simple: "SIMPLE",
        fast: "CEPAT",
        cheap: "MURAH",
        secure: "AMAN",
        title: "Jembatan kini menjadi {simple}, {fast}, {cheap}, dan {secure}",
        description:
          "Pindahkan crypto Anda dengan mudah antar jaringan (ETH, SOL, BNB, ARB, dll) semua dalam Meteor Wallet Anda. Cross-chain kini lebih mudah!",
        button: "Jembatani sekarang!",
      },
      "18": {
        title: "Misi Beruntun Diluncurkan",
        description:
          "Jalankan misi harian—perdagangkan memecoin, token jembatan, dan Tinkers penjelajah waktu. Teruskan misi untuk mendapatkan hadiah yang lebih besar!",
        button: "Mulai Misi",
      },
      "19": {
        title: "Tantangan Memecoin Sedang Berlangsung!",
        description:
          "Perdagangkan memecoin sekarang untuk kesempatan memenangkan bagian Anda dari $25.000! Tingkatkan streak perdagangan Anda untuk hadiah yang lebih besar. 10 pedagang teratas mendapatkan 10x hadiah.",
        button: "Daftar Sekarang",
      },
      "20": {
        title: "Akses Awal",
        subtitle: "Daftar sekarang untuk mendapatkan akses awal dan menikmati manfaat eksklusif",
        button: "Daftar Sekarang!",
      },
    },
    footer: {
      home: "Beranda",
      nft: "NFT",
      game: "$MOON",
      history: "Riwayat",
      explore: "Jelajah",
    },
    topup: {
      title: "Isi Ulang",
      label_intro_1: "Dapatkan",
      label_intro_2: "dalam Beberapa Detik",
      label_buy_with: "Beli dengan",
      label_recommended: "Disarankan",
      label_payment_options: "Opsi Pembayaran",
      text_mercuryo_description:
        "Peroleh cryptocurrency langsung dalam Meteor Wallet, tidak memerlukan dokumen.",
      text_onramper_description: "Agregator yang memiliki semua onramp fiat-ke-crypto utama.",
      text_ramp_description: "Agregator yang memiliki semua onramp fiat-ke-crypto utama.",
      toast: {
        topup_success_title: "Isi Ulang Berhasil",
        topup_success_description: "Koin Anda telah ditambahkan ke akun Anda",
        topup_failed_title: "Isi Ulang Gagal",
        topup_failed_description: "Silakan coba lagi nanti",
      },
    },
    staking: {
      label_staking_apy: "Pengembalian Tahunan",
      label_total_staked: "Total yang Di-Stake",
      label_total_delegators: "Total Delegator",
      label_daily_moon_drop: "Penurunan $MOON Harian",
      label_total_moon_earned: "Total $MOON yang Diperoleh",
      label_per_day: "Per Hari",
      label_start_staking: "Mulai Staking",
      label_boosted: "DIPERKUAT",
      hint_staking_apy:
        "Pendapatan persentase tahunan dari staking token NEAR Anda tergantung pada kondisi jaringan.",
      hint_total_staked:
        "Termasuk deposit awal dan hadiah yang telah secara otomatis di-stake ulang.",
      hint_total_delegators: "Jumlah dompet unik yang melakukan staking pada validator ini.",
      hint_daily_moon_drop:
        "Token $MOON yang diterima setiap hari didasarkan pada jumlah NEAR yang Anda stake. Jumlah yang dapat diterima dihitung setiap jam berdasarkan NEAR yang Anda stake.",
      hint_total_moon_earned:
        "Total token $MOON yang diperoleh dari staking dengan Validator Meteor.",
      button_stake_more: "Stake Lebih Banyak",
      button_unstake: "Unstake",
      button_claim: "Klaim",
      button_start_now: "Mulai",
      part_unstaking: {
        title: "Unstaking",
        description:
          "Anda sedang melakukan unstaking {balanceUnstaking} NEAR dari validator, ini biasanya membutuhkan waktu 48~72 jam untuk selesai",
      },
      part_unstaked: {
        title: "Unstaked",
        description:
          "Anda memiliki {balanceClaimReady} NEAR  hadiah yang belum diklaim, klik untuk klaim sekarang",
      },
      part_extra_reward: {
        title: "Hadiah Ekstra",
        description:
          "Anda memiliki {balanceExtraReward} hadiah yang belum diklaim, klik untuk klaim sekarang",
      },
      part_extra_reward_meteor: {
        title: "Anda Mendapatkan Hadiah Ekstra!",
        description_1:
          "Anda akan mendapatkan token $MOON setiap hari, dikreditkan ke akun Anda pada {STAKING_AUTO_CLAIM_TIME}. Periksa",
        description_2: "aktivitas dompet",
        description_3: "Anda untuk melihatnya.",
      },
      part_unclaimed_reward: {
        title: "Hadiah yang Belum Diklaim",
        description:
          "Anda memiliki {balanceExtraReward} $MOON hadiah yang belum diklaim, mulailah perjalanan Harvest Moon Anda untuk mengklaim",
      },
      section_stakings: {
        title: "Staking Saya",
        button_create_staking: "Buat Staking",
      },
      section_staking_stats: {
        title_1: "Dapatkan",
        title_2: "Staking",
        description:
          "Dapatkan hadiah hingga {STAKING_UP_TO_APY}% APY dengan melakukan staking NEAR di Meteor.",
        label_my_total_stakings: "Total Staking Saya",
        label_estimated_apy: "APY Estimasi",
      },
      subpage_create: {
        title: "Stake NEAR Anda",
        label_year: "tahun",
        label_everyday: "setiap hari",
        label_validator: "Validator",
        label_staking_details: "Detail Staking",
        label_reward: "Pengembalian Tahunan",
        label_estimated_yield: "Pengembalian yang Diharapkan",
        label_extra_reward: "Hadiah Bonus",
        label_extra_daily_reward_in_moon: "Hadiah Harian Ekstra di",
        label_select_validator: "Pilih Validator",
        label_delegators: "Delegator",
        hint_reward:
          "Pendapatan persentase tahunan dari staking token NEAR Anda tergantung pada kondisi jaringan.",
        hint_estimated_yield:
          "Pendapatan tahunan yang diperkirakan dalam USD didasarkan pada tingkat staking saat ini dan jumlah yang Anda stake. Penghasilan sebenarnya akan dalam token NEAR.",
        hint_extra_reward:
          "Dapatkan token $MOON tambahan setiap hari sebagai bonus staking. Token ini memenuhi syarat untuk hadiah Meteor di masa depan, seperti airdrop resmi kami.",
        button_stake_now: "Stake Sekarang",
        warning_unstake_period: "Ada periode penguncian 48~72 jam selama unstake",
      },
      toast: {
        unstake_success_title: "Anda telah berhasil melakukan unstake",
        unstake_success_description:
          "Anda telah berhasil melakukan unstake {unstakeAmount} NEAR dari {validatorId}",
        unstake_failed_title: "Unstake gagal",
        unstake_failed_description: "Klaim hadiah staking gagal: {message}",
        claim_success_title: "Berhasil diklaim",
        claim_success_description:
          "Anda telah berhasil mengklaim hadiah staking Anda {amount} NEAR",
        claim_failed_title: "Terjadi kesalahan",
        claim_failed_description: "Klaim hadiah staking gagal: {message}",
        claim_farm_success_title: "Hadiah staking berhasil diklaim",
        claim_farm_success_description: "Anda telah berhasil mengklaim hadiah staking Anda",
        claim_farm_failed_title: "Terjadi kesalahan",
        claim_farm_failed_description: "Klaim hadiah staking gagal: {message}",
        no_claim_title: "Tidak ada hadiah yang dapat diklaim",
        no_claim_description: "Tidak ada hadiah yang dapat diklaim",
      },
      modal: {
        unstake: {
          title: "Unstake",
          label_amount_to_unstake: "Jumlah untuk Unstake",
          label_validator_details: "Detail Validator",
          label_provider: "Penyedia",
          label_staking_apy: "APY Staking",
          label_unlock_period: "Periode Buka Kunci",
          label_total_staked_amount: "Jumlah Total Staking",
          button_confirm_unstake: "Konfirmasi Unstake",
        },
        stake: {
          label_stake_success: "Stake Berhasil",
          label_stake_failed: "Stake Gagal",
          label_transaction_details: "Detail Transaksi",
          label_status: "Status",
          label_success: "Berhasil",
          label_failed: "Gagal",
          label_date_time: "Tanggal & Waktu",
          label_transaction_fee: "Biaya Transaksi",
          label_transaction_id: "ID Transaksi",
          label_error_message: "Pesan Kesalahan",
          button_done: "Selesai",
        },
      },
    },
    telegram: {
      linking_wallet_to_account: "Menghubungkan dompet ke akun Telegram",
      quote_of_the_day: "Kutipan hari ini",
      modal: {
        conflict_account: {
          title: "Anda sudah memiliki dompet yang terhubung ke akun Telegram Anda",
          text_import: "Anda dapat mengimpor",
          text_import_or_create: "mengimpor dompet lain atau membuat dompet baru",
          text_if_import_or_create: "Jika Anda mengimpor dompet lain atau membuat dompet baru",
          text_telegram_account_override:
            "akun Telegram Anda akan dihubungkan ke dompet baru sebagai gantinya",
          button_import_existing: "Impor",
          button_import_another: "Impor dompet lain",
          button_create_new: "Buat dompet baru",
          label_or: "atau",
        },
        connect_account: {
          title: "Hubungkan Akun Telegram",
          description:
            "Hanya satu akun dompet yang dapat dihubungkan ke akun Telegram Anda. Fitur masa depan akan memungkinkan Anda untuk mengubah dompet mana yang terhubung dengan Anda.",
          button_continue: "Lanjutkan",
        },
        import_linked_account: {
          title: "Impor akun Anda yang sudah ada",
          description:
            "Anda dapat mengimpor akun Anda yang sudah ada dengan menggunakan frasa rahasia atau kunci pribadi Anda",
          text_choose_import_method: "Pilih metode impor",
          button_next: "Selanjutnya",
          button_back: "Kembali",
        },
      },
    },
    harvest_moon: {
      tab_harvest: {
        ledger: {
          title: "Izin Akses Aman untuk Pengguna {LedgerComponent}",
          description:
            "Bagi pengguna Ledger, menambahkan kunci akses panggilan fungsi sangat penting untuk pengalaman yang mulus di Harvest Moon. Kunci ini hanya untuk fungsionalitas antarmuka dan tidak memberi kami akses ke dana atau kunci dompet pribadi Anda. Aset Anda tetap sepenuhnya di bawah kendali Anda.",
          add_now: "Tambahkan sekarang",
        },
        section_dashboard: {
          label_storage: "Penyimpanan",
          label_my_moon_balance: "Saldo $MOON Saya",
          button_next_harvest: "Panen Berikutnya",
        },
        section_game_stats: {
          title: "STATISTIK PERMAINAN",
          label_coming_soon: "Segera Hadir",
          text_news_mechanic: "Mekanika Game dan Hadiah",
          text_news_guide: "Panduan Game",
          text_news_launch_week: "Minggu Peluncuran Harvest Moon Telah Tiba",
          text_news_hm_missions: "Misi Harvest Moon",
          button_relic_booster: "Penguat Relik",
          button_player_level: "Level Pemain",
          button_ranking: "Peringkat",
          button_contract_drop: "Kontrak Jatuh",
          button_token_drop: "Token Jatuh",
          button_referral: "Rujukan",
          label_enrolled: "Terdaftar",
        },
        section_announcement: {
          title: "PENGUMUMAN",
        },
        subpage_tier: {
          title: "Level Pemain",
          label_current_tier: "Tingkat Saat Ini",
          label_conditions_to_unlock: "Kondisi untuk Membuka",
          label_current_benefits: "Manfaat Saat Ini",
          label_upgrade_to_unlock: "Tingkatkan untuk Membuka",
          label_coming_soon: "SEGERA HADIR",
          button_uprgade_tier: "TINGKATKAN TINGKAT",
          button_uprgade_tier_locked: "TINGKATKAN TINGKAT (TERKUNCI)",
        },
        subpage_referral: {
          title: "Referral",
          label_last_7_days_earned_from_referral: "Pendapatan 7 Hari Terakhir dari Referral",
          text_moon_earned_by_referral_is_distributed_to:
            "Moon yang diperoleh dari referral didistribusikan ke {walletId}",
          label_your_primary_wallet: "dompet utama Anda",
          label_my_total_friends: "Total Teman Saya",
          button_copy_referral_link: "Salin",
          label_total_moon_earned_from_referral:
            "Total $MOON yang Diperoleh dari Rujukan (7 hari terakhir)",
          label_my_friends: "Teman Saya",
          label_total_records: "Total {count} Rekaman",
          label_total_moon_earned: "Total $MOON yang Diperoleh",
          label_refer_and_earn: "Referensi & Dapatkan Hadiah",
          label_refer_and_earn_desc: "Referensikan teman untuk mendapatkan",
          label_refer_and_earn_desc_2: "20% dari hadiah $MOON",
          label_refer_and_earn_desc_3: "dan satu",
          label_refer_and_earn_desc_4: "Kontrak Dasar",
          label_level: "Level",
          label_wallet_id: "ID Dompet",
          label_telegram_id: "ID Telegram",
          label_last_harvest_at: "Panen Terakhir Di",
          button_remind_to_harvest: "Ingatkan untuk Panen",
          button_share_on_tg: "Bagikan di TG",
          button_share_on_x: "Bagikan di X",
        },
        subpage_contract_drop: {
          title: "Kontrak Jatuh",
          label_my_union_contract_drop_stats: "Statistik Penurunan Kontrak Serikat Saya",
          text_chance_of_getting_contract_at_full_storage:
            "Kemungkinan Mendapatkan Kontrak di Penyimpanan Penuh",
          label_union_contract_drop_rate: "Tingkat Penurunan Kontrak Serikat",
          text_union_contract_drop_rate:
            "Kemungkinan Anda mendapatkan kontrak serikat meningkat dengan jam panen Anda. Meningkatkan penyimpanan Anda memungkinkan Anda untuk panen lebih banyak jam (dari 2h hingga 24h), meningkatkan peluang Anda. Tingkat penurunan maksimum per panen adalah {dropRatePerHour}%.",
          label_union_contract_type: "Jenis Kontrak Serikat",
          text_union_contract_type:
            "Buka berbagai jenis kontrak serikat dengan meningkatkan level. Level pemain yang lebih tinggi memberi Anda akses ke kontrak yang lebih jarang. Peluang penurunan meningkat dengan level penyimpanan yang lebih tinggi. Misalnya, kontrak ahli memiliki tingkat penurunan 1% pada level penyimpanan 1 tetapi meningkat menjadi 15% pada level penyimpanan 9.",
          button_upgrade_storage: "Tingkatkan Penyimpanan",
          button_check_player_level: "Periksa Level Pemain",
        },
        subpage_token_drop: {
          title: "Distribusi Token",
          title_token_drop: "Distribusi Token",
          desc_token_drop:
            "Dapatkan kesempatan untuk mendapatkan token tambahan saat Anda memenuhi kriteria kampanye selama panen.",
          label_campaign: "Kampanye",
          label_met_criteria: "Memenuhi Syarat",
          label_not_met_criteria: "Tidak Memenuhi Syarat",
          label_enrolled: "Terdaftar",
          label_rewards: "Hadiah",
          label_period: "Periode",
          label_claimed_rewards: "Hadiah yang Diklaim",
          button_view_details: "Lihat Detail",
          button_enroll: "Daftar",
          label_criteria: "Kriteria",
          label_completed: "Selesai",
          label_incomplete: "Tidak Lengkap",
          label_player_level: "Level Pemain",
          text_staked_at_least_100_near:
            "Dipertaruhkan (tautan) setidaknya 100 Near dengan Meteor Validator",
          button_enroll_now: "Daftar Sekarang",
          campaigns: {
            title: {
              referral_token_drop_2: "Referensikan & Dapatkan",
              gear_token_drop: "Perjalanan Waktu & Dapatkan",
              lonk_token_drop: "Tantangan Pemula",
              memecoin_token_drop: "Perdagangan Memecoin",
              swap_mission_drop: "Tantangan Memecoin",
            },
            description: {
              referral_token_drop_2:
                "Undang teman-teman Anda dan dapatkan hadiah dari kumpulan hadiah $3.500! Acara berlangsung hingga kumpulan hadiah sepenuhnya diklaim, jadi mulailah merujuk sekarang!",
              swap_mission_drop:
                "Bergabunglah dengan misi harian trading Memecoin dan bersaing untuk mendapatkan bagian dari prize pool $25.000 USDC! Acara berlangsung sampai pool sepenuhnya diklaim, jadi mulailah trading sekarang!",
            },
            how_it_works: {
              referral_token_drop_2: {
                step_1:
                  "Referensikan setidaknya <b>1 pengguna baru yang merekrut 5 Tinkers.</b> Setelah memenuhi syarat, panen berikutnya Anda memiliki peluang 50% untuk mendapatkan distribusi token tambahan <i>(Peluang maksimal dengan panen 4 jam)</i>",
                step_2:
                  "<b>Dapatkan antara $0,05 dan $10 dalam hadiah token.</b> Semakin banyak referensi, semakin besar hadiahnya!",
                step_3:
                  "Sebanyak 120B Black Dragon (~$3.500) akan didistribusikan selama kampanye ini.",
                label_distributed: "Didistribusikan",
                label_remaining: "Tersisa",
              },
              swap_mission_drop: {
                step_1_title: "Selesaikan 5 Hari Berturut-turut",
                step_1_description:
                  "Perdagangkan memecoin selama 5 hari berturut-turut untuk membuka peluang 50% mendapatkan token bonus di setiap panen. Lihat memecoin yang memenuhi syarat.",
                step_2_title: "Hadiah",
                step_2_description:
                  "Dapatkan hadiah harian berdasarkan panen 24 jam, mulai dari $0,75 hingga $2,50, tergantung pada streak Anda dan faktor acak. Panen yang lebih pendek berarti hadiah yang lebih kecil. 10 pedagang teratas (berdasarkan volume) dapat memperoleh hadiah 10x, hingga $25 per hari.",
                step_3_title: "Total Hadiah",
                step_3_description: "Total $25.000 USDC akan didistribusikan selama kampanye.",
                label_distributed: "Didistribusikan",
              },
            },
            my_progress: {
              swap_mission_drop: {
                complete_5_days_streak: "Selesaikan 5 hari berturut-turut untuk memenuhi syarat.",
                total_campaign_earnings: "Total Pendapatan Kampanye",
                earn_bonus_rewards: "Dapatkan Hadiah Bonus",
                top_10_trades_get: "10 Perdagangan Teratas Mendapatkan",
                rewards: "Hadiah",
                top_10_traders: "10 Pedagang Teratas",
              },
            },
          },
          label_not_enrolled: "Tidak Terdaftar",
          label_criteria_unmet: "Kriteria Tidak Terpenuhi",
          label_status: "Status",
          tooltip_status:
            "Terdaftar: Anda berada dalam distribusi token. Kriteria Tidak Terpenuhi: Persyaratan tidak terpenuhi. Tidak Terdaftar: Anda tidak terdaftar.",
          label_until_reward_empty: "Sampai kumpulan hadiah habis",
          campaign_status: {
            ACTIVE: "Aktif",
            ENDED: "Berakhir",
            PAUSED: "Dijeda",
          },
          label_how_it_works: "Cara Kerjanya",
          label_my_progress: "Kemajuan Saya",
          label_qualification_status: "Status Kualifikasi",
          label_recent_activity: "Aktivitas Terbaru",
          label_you_have_referred: "Anda telah mereferensikan",
          label_users: "pengguna",
          description_qualification_status:
            "Referensi hanya dihitung setelah mereka merekrut 5 Tinkers, dan hanya referensi baru dari kampanye ini yang memenuhi syarat.",
          label_referral_activity: "Aktivitas Referensi",
          label_tinkers: "Tinkers",
          label_prize_pool: "Kumpulan Hadiah",
          label_up_to: "Hingga",
          label_each_harvest: "Setiap Panen",
          tooltip_rewards: "Hadiah dihitung berdasarkan harga token secara real-time.",
          button_coming_soon: "SEGERA DATANG",
        },
        modal: {
          gas_free: {
            title:
              "Dengan transaksi bebas gas, kami menanggung biaya untuk gameplay Harvest Moon yang lancar!",
            button_close: "TUTUP",
          },
          upgrade_tier: {
            title: "Tingkatkan Tingkat",
            label_upgrade_to_unlock: "Tingkatkan untuk Membuka",
            button_upgrade_now: "Tingkatkan Sekarang",
          },
          my_referrer: {
            label_my_referrer: "Referensi Saya",
            label_wallet_id: "ID Dompet",
            label_telegram_id: "ID Telegram",
            label_status: "Status",
            label_lab_level: "Tingkat Laboratorium",
            button_update_referrer: "Perbarui Referensi",
            footer_text:
              "Anda hanya dapat mengubah referensi jika tingkat produksi Anda di bawah 0,1 $MOON/jam.",
            label_active: "Aktif",
            label_inactive: "Tidak Aktif",
            label_update_referrer: "Perbarui Referensi",
            label_referrer_wallet_id: "ID Dompet Referensi",
            button_confirm: "Konfirmasi Pembaruan",
            button_cancel: "Batal",
          },
        },
        toast: {
          tier_upgrade_success: "Peningkatan tingkat berhasil",
          link_telegram_failed: "Pengaitan ke telegram gagal. Silakan coba lagi.",
          referral_telegram_failed:
            "Anda sudah membuat/mengimpor dompet. Tautan referensi tidak valid.",
          referred_and_get_reward_with_name:
            "Anda dirujuk oleh {referrer} dan akan menerima hadiah tambahan setelah menyelesaikan pembuatan akun Anda.",
          referred_and_get_reward_without_name:
            "Anda dirujuk dan akan menerima hadiah tambahan setelah menyelesaikan pembuatan akun Anda.",
        },
      },
      tab_mission: {
        newbie_challenge: {
          newbie: "Pemula",
          challenge: "Tantangan",
          of: "dari",
          description:
            "Naik level dan tingkatkan pengaturan Anda untuk mendapatkan hadiah dan meningkatkan gameplay Anda!",
          prev: "Sebelumnya",
          next: "Berikutnya",
          task: "Tugas",
          task_1: {
            join_harvest_moon: "Bergabung dengan Harvest Moon",
            receive_basic_contract: "Terima hadiah Kontrak Dasar!",
          },
          task_2: {
            reach_player_level_3: "Capai Level Pemain 3",
            receive_advanced_contract: "Terima hadiah Kontrak Lanjutan!",
          },
          task_3: {
            reach_container_level_3: "Capai Level Kontainer 3",
            reach_lab_level_3: "Capai Level Laboratorium 3",
            receive_expert_contract: "Terima hadiah Kontrak Ahli!",
            button_upgrade_now: "Tingkatkan Sekarang",
          },
        },
        new_missions: {
          active_forever: "Aktif Selamanya",
          active_for: "Aktif selama",
          vote: "Vote",
          surprise_partnership_title: "Kemitraan Kejutan",
          surprise_partnership_desc: "Buka cara baru untuk membelanjakan crypto",
          meteor_master_card_desc: "Ajukan permohonan akses awal",
          coming_soon: "Segera Hadir",
          get_alpha_access_title: "Dapatkan Akses Alpha",
          get_alpha_access_desc: "Jadilah yang pertama menguji aplikasi Meteor!",
          ended: "Berakhir",
          staked: "Staked",
          delayed: "Ditunda",
        },
        meme_season_7: {
          tab_title: {
            INFO: "Info",
            STAKE_VOTE: "Stake & Vote",
            UNSTAKE: "Unstake",
            MYREWARDS: "Hadiah Saya",
          },
          phase_1: {
            page_title: "Pemungutan Suara xRef",
            title_1: "Pemungutan Suara xRef",
            title_2: "(Fase 1 - Musim Meme 10)",
            description:
              "Ikuti Kontes MEME Ref dan dapatkan hadiah untuk mendukung komunitas Meteor dan $GEAR!",
            tab_content: {
              info: {
                campaign_info: {
                  title: "Info Kampanye",
                  voting_period: "Periode Pemungutan Suara",
                  voting_period_tooltip:
                    "Jika Anda sebelumnya telah memilih di musim sebelumnya, Anda tidak perlu melepaskan untuk memilih lagi, suara Anda akan dihitung melalui Meteor atau Ref apa pun yang terjadi",
                  snapshot_period: "Snapshot",
                  snapshot_period_desc: "{snapshot_period} (Unstake sebelum ini tidak dihitung)",
                  unstaking_available: "Unstake",
                  unstaking_available_desc: "Tersedia pada {unstaking_available}",
                  day_lock:
                    "Unstaking akan tersedia dari tanggal 1 hingga 6 UTC 00:00 bulan depan.",
                  minimum_stake: "Taruhan Minimum",
                  minimum_stake_desc: "Taruhkan setidaknya {amount} xRef untuk berpartisipasi",
                },
                participation_info: {
                  title: "Hadiah Partisipasi",
                  advanced_contract: "1x Kontrak Lanjutan untuk memberikan setidaknya 1 suara",
                  raffle_ticket: "Tiket Undian untuk setiap xRef/GEAR tambahan yang dipilih",
                },
                rewards_info: {
                  title: "Hadiah Undian Potensial",
                  gear: "Hingga $3,000 dalam $GEAR akan diundi berdasarkan pencapaian yang dicapai.",
                  contract:
                    "Hingga 6,000 kontrak lanjutan dan 500 kontrak ahli berdasarkan pencapaian.",
                  token:
                    "Hingga $50K Hadiah Musim Meme berdasarkan kekuatan pemungutan suara komunitas",
                },
                milestone_info: {
                  title: "Hadiah Tonggak",
                  description:
                    "Setiap tonggak menambahkan lebih banyak item ke kolam undian. Setiap tiket undian memberi Anda kesempatan untuk memenangkan hadiah.",
                },
              },
              unstake: {
                coming_soon: "Unstake akan tersedia pada {unstaking_available}",
                unstake_period:
                  "Harap dicatat bahwa akan ada periode penguncian sekitar {days} hari",
                description_unstaking:
                  "Anda sedang melakukan unstake {balanceUnstaking} xRef Token. Ini biasanya memakan waktu sekitar {days} hari untuk diselesaikan",
              },
              myreward: {
                title: "Hadiah Undian",
                coming_soon: "Hasil undian akan diumumkan pada {raffle_reward}",
                button_claimed: "Diklaim",
                button_claimable: "Klaim",
                button_not_qualified: "Tidak Memenuhi Syarat",
              },
            },
          },
          phase_2: {
            page_title: "Pemungutan Suara xRef",
            title_1: "Pemungutan Suara xRef",
            title_2: "(Fase 2 - Musim Meme 10)",
            description:
              "Ikuti Kontes MEME Ref dan dapatkan hadiah untuk mendukung komunitas Meteor dan $GEAR!",
            tab_content: {
              info: {
                campaign_info: {
                  title: "Info Kampanye",
                  voting_period: "Periode Pemungutan Suara",
                  snapshot_period: "Snapshot",
                  snapshot_period_desc: "{snapshot_period} (Unstake sebelum ini tidak dihitung)",
                  unstaking_available: "Unstake",
                  unstaking_available_desc: "Tersedia pada {unstaking_available}",
                },
                participation_info: {
                  title: "Hadiah Partisipasi",
                  advanced_contract: "1x Kontrak Lanjutan untuk memberikan setidaknya 1 suara",
                  raffle_ticket: "Tiket Undian untuk setiap xRef/GEAR tambahan yang dipilih",
                },
                rewards_info: {
                  title: "Hadiah Undian Potensial",
                  gear: "Hingga $3,000 dalam $GEAR akan diundi berdasarkan pencapaian yang dicapai.",
                  contract:
                    "Hingga 6,000 kontrak lanjutan dan 500 kontrak ahli berdasarkan pencapaian.",
                  token:
                    "Hingga $50K Hadiah Musim Meme berdasarkan kekuatan pemungutan suara komunitas",
                },
                milestone_info: {
                  title: "Hadiah Tonggak",
                  description:
                    "Setiap tonggak menambahkan lebih banyak item ke kolam undian. Setiap tiket undian memberi Anda kesempatan untuk memenangkan hadiah.",
                },
              },
              stake: {
                stake_period:
                  "Stake setidaknya {stake_amount} GEAR untuk mendapatkan kontrak lanjutan.",
              },
              unstake: {
                coming_soon: "Unstake akan tersedia pada {unstaking_available}",
                unstake_period:
                  "Harap dicatat bahwa akan ada periode penguncian sekitar {days} hari",
                description_unstaking:
                  "Anda sedang melakukan unstake {balanceUnstaking} GEAR Token. Ini biasanya memakan waktu sekitar {days} hari untuk diselesaikan",
              },
              myreward: {
                title: "Hadiah Undian",
                coming_soon: "Hasil undian akan diumumkan pada {raffle_reward}",
                button_claimed: "Diklaim",
                button_claimable: "Klaim",
                button_not_qualified: "Tidak Memenuhi Syarat",
              },
            },
          },
        },
        section_challenge: {
          title: "Tantangan Pemula",
          description:
            "Tingkatkan level dan tingkatkan pengaturan Anda untuk mendapatkan hadiah dan meningkatkan gameplay Anda!",
          button_start: "Mulai",
          label_challenge_list: "Daftar Tantangan",
          button_remind_to_harvest: "Ingatkan untuk Panen",
          button_claim: "Klaim",
          label_tier: "Tingkat",
          label_basic_info: "Info Dasar",
          label_friend_quests: "Misi Teman",
          label_last_7_days_contribution: "Kontribusi 7 Hari Terakhir",
          label_filter_by_status: "Filter berdasarkan Status",
          label_active: "Aktif",
          label_inactive: "Tidak Aktif",
          text_inactive: "Pemain belum memulai panen bulan",
          button_filter: "Filter",
          label_no_friend_yet: "Belum Ada Teman",
          label_refer_and_earn_reward: "Referensikan & Dapatkan Hadiah",
          text_share: "Klik tombol bagikan di atas dan mulai mengundang teman!",
          label_refer_and_earn_desc: "Referensikan teman untuk mendapatkan",
          label_refer_and_earn_desc_2: "20% dari hadiah $MOON",
          label_refer_and_earn_desc_3: "dan satu",
          label_refer_and_earn_desc_4: "Kontrak Dasar",
          button_verify_telegram: "Verifikasi Akun Telegram Sekarang",
          label_friend_list: "Daftar Teman",
          button_remind_to_harvest_all: "Ingatkan untuk Panen Semua",
          button_click_to_refresh: "Klik pada daftar teman untuk melihat lebih detail",
          label_tier_level: "Tingkat Tier",
          label_container_level: "Tingkat Kontainer",
          label_lab_level: "Tingkat Lab",
        },
        section_profile: {
          label_player_tier: "Level Pemain",
          label_total_earned: "Total Diperoleh",
        },
        section_missions: {
          text_upgrade_tier_not_tier_3:
            "Tingkatkan ke Tier 3 untuk membuka misi dengan hadiah menarik. Segera hadir!",
          text_upgrade_tier_tier_3: "Tetap tenang dan bersiap - kami akan meluncurkan misi segera!",
          button_upgrade_now: "Upgrade Sekarang",
          coming_soon: "SEGERA DATANG",
        },
        section_home: {
          missions: "Misi",
          coming_soon: "Segera hadir",
          title:
            "Dapatkan kontrak, rekrut Tinkers, dan tingkatkan hadiah. Bergabunglah dengan perdagangan dan penurunan token untuk kesempatan memenangkan hadiah uang tunai!",
          flash_missions: "Misi Kilat",
          streak_missions: "Misi Beruntun",
          flash_mission_list: "Daftar Misi Kilat",
          prize_pool: "Kolam Hadiah",
          newbie_title: "Tantangan Pemula",
          newbie_subtitle: "Belajar & Naik Level",
          phase1_title: "Vote dengan xRef",
          phase1_subtitle: "Fase 1 - Musim Meme 10",
          phase2_title: "Vote dengan $GEAR",
          phase2_subtitle: "Fase 2 - Musim Meme 10",
          streak: "Beruntun",
        },
        section_coming_soon: {
          title_xref: "Vote dengan xRef",
          title_gear: "Vote dengan $GEAR",
          subtitle_xref: "Vote dengan xRef (Fase 1 - Musim Meme 10)",
          subtitle_gear: "Vote dengan $GEAR (Fase 2 - Musim Meme 10)",
          coming_soon: "Segera hadir",
          title: "Vote dengan xRef (Fase 1 - Musim Meme 10)",
          days: "Hari",
          hours: "Jam",
          minutes: "Menit",
          button_back: "Kembali",
        },
        mission_content: {
          [EMissionSubType.SWAP_TO]: {
            title: "Perdagangkan Memecoin",
            description:
              "Tukarkan $5+ dalam memecoin untuk mendapatkan kontrak dasar. Pertahankan rentetan harian Anda untuk naik level lebih cepat dan dapatkan hadiah lebih besar dengan token yang dijatuhkan! Lewatkan satu hari, dan rentetan dan total volume perdagangan Anda akan disetel ulang pada {time} (0.00 UTC).",
            total_count: "Jumlah Volume: ${count}",
          },
          [EMissionSubType.BRIDGE_FROM]: {
            title: "Jembatankan Token",
            description:
              "Gunakan Meteor Bridge untuk memindahkan token dengan mudah di berbagai blockchain. Bridge minimal $25 (di kedua arah) untuk mendapatkan kontrak lanjutan. Pertahankan rentetan harian Anda untuk naik level lebih cepat dan membuka hadiah yang lebih besar dengan token drop! Lewatkan satu hari, dan rentetan dan total volume perdagangan Anda akan diatur ulang pada pukul {time} (0.00 UTC)",
            total_count: "Jumlah Volume: ${count}",
          },
          [EMissionSubType.HM_TIME_TRAVEL]: {
            title: "Perjalanan Waktu Tinker",
            description:
              "Berhasil melakukan perjalanan waktu dengan Tinker mana pun untuk mendapatkan kontrak dasar. Pertahankan rentetan harian Anda untuk naik level lebih cepat dan dapatkan hadiah yang lebih besar dengan token yang dijatuhkan! Lewatkan satu hari, dan rentetan Anda akan disetel ulang pada pukul {time} (0.00 UTC)",
            total_count: "Jumlah Volume: {count}",
          },
        },
        section_mission_detail: {
          total_trade: "Perdagangan Total",
          day_streak: "Beruntun Hari",
          mission_details: "Detail Misi",
          eligible_tokens: "Token yang Memenuhi Syarat",
          today_progress: "Kemajuan Hari Ini",
          mission_accomplished: "Misi Tercapai",
          continue_streak: "Lanjutkan Beruntun Anda Besok!",
          live: "LIVE",
          token_drop_rewards: "Hadiah Drop Token",
          usdc_giveaway: "Penurunan Token USDC $25k Sedang Berlangsung",
          streak_mission_list: "Daftar Misi Beruntun",
          reward: "Hadiah",
          btn_letsgo: "Ayo berangkat",
          btn_swap: "Tukar sekarang",
          btn_bridge: "Jembatan sekarang",
          btn_time_travel: "Perjalanan waktu sekarang",
          day1: "Sn",
          day2: "Sl",
          day3: "Rb",
          day4: "Km",
          day5: "Jm",
          day6: "Sb",
          day7: "Mg",
          view_info: "Lihat Info",
          see_more: "Lihat lebih banyak",
        },
      },
      tab_tinker: {
        section_production_rate: {
          title: "Tingkat Produksi Tinker",
          label_moon_per_hour: "$MOON/JAM",
          button_recruit: "Rekrut Tinker",
        },
        section_active_tinkers: {
          title: "TINKER AKTIF SAYA",
          subtitle: "{count} Tinker",
          subtitleExtra: "Kapasitas Lab",
          button_fusion: "Perjalanan Waktu",
          label_the: "The",
          label_new_production_rate: "Tingkat Produksi Baru",
          label_moon_per_hour: "$MOON/Jam",
          tooltip_fusion:
            "Tingkatkan Tinker Anda dengan mengirim mereka dalam petualangan perjalanan waktu! Setiap Tinker memiliki tingkat keberhasilan yang unik, dan Anda dapat membakar GEAR untuk meningkatkan peluang mereka. Namun, jika Tinker Anda gagal, Anda akan kehilangannya.",
        },
        section_union_contracts: {
          title: "KONTRAK SERIKAT",
          subtitle: "Total {count} Kontrak",
        },
        toast: {
          recruiting_tinker: "Merekrut Tinker(s)",
          recruit_tinker_failed: "Rekrut Tinker gagal. Silakan coba lagi.",
        },
        modal: {
          no_new_mph: {
            title:
              "Tukang baru yang direkrut tidak meningkatkan tingkat produksi keseluruhan karena susunan saat ini lebih efisien, sehingga tidak ada peningkatan dalam MPH. Pertimbangkan untuk meningkatkan laboratorium Anda untuk meningkatkan tingkat produksi.",
          },
          tinker_fusion: {
            title: "Perjalanan Waktu",
            description: "Tingkatkan tinker Anda ke level yang baru!",
            label_how_many: "Berapa banyak",
            label_to_fusion: "untuk melakukan perjalanan waktu",
            label_burn: "Bakar",
            label_to_increase_success_rate: "untuk meningkatkan tingkat keberhasilan",
            label_total_moon_cost: "Total biaya $MOON",
            label_total_gear_cost: "Total biaya GEAR",
            label_balance: "Saldo",
            label_success_rate: "Tingkat Keberhasilan",
            label_info: "Jika perjalanan waktu gagal, Tinker Anda akan hilang.",
            button_start_fusion: "Mulai Perjalanan Waktu",
            warning_not_enough_gear: "Anda tidak memiliki cukup GEAR.",
            button_buy_now: "Beli Sekarang",
          },
          tinker_production_rate: {
            title: "Tinjauan Umum Produksi Tinker",
            subtitle:
              "Lab Anda akan secara otomatis menggunakan Tinker yang paling efisien terlebih dahulu. {upgrade} untuk meningkatkan kapasitas atau gunakan {relics} untuk meningkatkan laju produksi.",
            upgrade: "Tingkatkan lab Anda",
            relics: "Relics",
            desc1: "Magang Direkrut :",
            desc2: "Magang Diterapkan :",
            desc3: "Laju Produksi Aktif :",
            totalTinkers: "Total tinkers : ",
            labCapacity: "Kapasitas Lab : ",
            relic_boost: "Peningkatan Relic",
            production_rate: "Laju Produksi",
          },
        },
      },
      tab_upgrade: {
        section_lab_stats: {
          title: "STATISTIK LAB",
          label_container: "Kontainer",
          label_moonlight_storage: "Penyimpanan Moonlight",
          label_lab_capacity: "Kapasitas Lab",
          label_maximum_tinker: "Tinker Maksimum",
          button_upgrade: "Upgrade",
        },
        section_experiments: {
          title: "PERCOBAAN GEAR",
          label_relics: "Relik",
          label_moon_exchange: "Pertukaran $MOON",
          label_boost: "Peningkatan",
          label_left: "Kiri",
          text_countdown_info: "Pertukaran $MOON tersedia selama {countdown} hari lagi.",
        },
        subpage_gear_relics: {
          title: "Relik GEAR",
          label_unlock_relic_slot: "Buka Slot Relik",
          text_unlock_relic_slot: "untuk membuka slot relik baru",
          label_current_balance: "Saldo Saat Ini",
          button_buy_gear: "Beli Perlengkapan",
          section_boost_rate: {
            label_boost_rate: "Tingkat Peningkatan",
            label_equipped_relics: "Relik yang Dipasang",
          },
          section_forge_relic: {
            label_forge_relic: "Membuat Relik",
            label_burn_gear_1: "Bakar",
            label_burn_gear_2: "untuk mendapatkan relik baru",
            label_buy_sell_relic: "Beli/Jual Relik",
            text_buy_sell_relic: "Dapatkan NFT Relik Anda via Marketplace",
            label_harvest_moon_relic: "Relik Harvest Moon",
            text_harvest_moon_relic: "Dapatkan 10% Boost",
            label_union_contract_relic: "Relik Kontrak Union",
            text_union_contract_relic: "Dapatkan 50% Boost",
            label_gear_relic: "Relik Gear",
            label_other_relic: "Relik Lainnya",
            label_gear_relic_on_paras: "Relik Perlengkapan di Paras",
            label_gear_relic_on_tradeport: "Relik Perlengkapan di Tradeport",
            text_gear_relic: "Dapatkan 25% ~ 250% Boost",
          },
          section_relics: {
            title: "Relik yang Tersedia",
            label_drop_rate: "Tingkat Drop",
            label_rarity: "Peluang",
            label_boost_rate: "Tingkat",
            label_total: "Total",
            label_unequip: "Lepaskan",
            label_unequip_cooldown: "Waktu Tunggu Lepaskan",
            text_maturity: "Anda hanya dapat melepas peralatan yang dipasang setelah {days} hari",
            warning_no_relics: "Anda tidak memiliki relik. Buatlah sekarang atau beli di Paras.",
          },
        },
        subpage_moon_exchange: {
          title: "Pertukaran MOON",
          label_select_asset_to_exchange_with: "Pilih aset untuk ditukar",
          label_conversion_rate: "Tingkat Konversi",
          label_click_to_start_convert: "Klik pada daftar untuk mulai mengonversi",
          section_exchange: {
            title: "PERTUKARAN",
            label_asset_to_receive: "Aset untuk diterima",
            label_asset_to_exchange_with: "Aset untuk ditukar",
            label_you_are_going_to_convert: "Anda akan mengonversi",
            label_to: "ke",
            button_conversion_rate: "Tingkat Konversi",
            button_convert: "Konversi",
          },
        },
        toast: {
          exchange_success: "Berhasil menukar {from} dengan {to}",
          forging_relic: "Membuat",
          forging_relic_success: "Pembuatan berhasil",
          unlocking_relic_slot: "Membuka",
          unlocking_relic_slot_success: "Berhasil membuka slot relik",
          equip_relic_success: "Berhasil dipasang",
          unequip_relic_success: "Berhasil dilepas",
          upgrade_container_success: "Peningkatan kontainer berhasil",
          upgrade_lab_success: "Peningkatan lab berhasil",
          sunset_gear: "Penyetoran GEAR akan berakhir",
          button_unstake: "Tarik di sini",
          button_forge: "Buat di sini",
          button_close: "Tutup",
          button_equip: "Pasang",
          button_unlock: "Buka Sekarang",
        },
      },
      relic_rarity: {
        [EHarvestMoon_RelicRarity.common]: "Biasa",
        [EHarvestMoon_RelicRarity.uncommon]: "Tidak Biasa",
        [EHarvestMoon_RelicRarity.rare]: "Langka",
        [EHarvestMoon_RelicRarity.legendary]: "Legendaris",
      },
      tier: {
        tier_name_1: "Niveau du joueur: 1",
        tier_name_2: "Niveau du joueur: 2",
        tier_name_3: "Niveau du joueur: 3",
        tier_description_1:
          "C'est ici que commence votre voyage. Votre compte sera rechargé avec une transaction sans gaz chaque jour",
        tier_description_2:
          "Félicitations pour votre entrée dans le monde de la crypto ! Explorez les fondamentaux de la crypto et accélérez votre voyage MOON",
        tier_description_3:
          "Plongez plus profondément dans le monde de DeFi et de l'écosystème NEAR pour améliorer votre expérience et promouvoir votre niveau.",
        benefits: {
          one_gas_free_transaction_everyday: "1 transaction sans gaz tous les jours",
          eligible_for_basic_contracts_during_harvest_lotteries:
            "Éligible pour des contrats de base lors des loteries de récolte",
          harvest_anytime_without_waiting_period: "Récoltez à tout moment sans période d'attente",
          chance_to_get_advanced_contract_during_harvest:
            "Chance d'obtenir un contrat avancé lors de la récolte",
          chance_to_get_expert_contract_during_harvest:
            "Chance d'obtenir un contrat d'expert lors de la récolte",
          unlock_missions_feature: "Débloquer la fonctionnalité des missions",
          automated_harvest: "Récolte automatisée",
          automated_recruit_when_you_get_contract_from_harvesting:
            "Recrutement automatisé (lorsque vous obtenez un contrat de la récolte)",
        },
        conditions: {
          hold_3_near_in_your_wallet_description: "Simpan 3 NEAR di dompet Anda",
          hold_3_near_in_your_wallet_button: "Deposit",
          set_a_password_for_your_wallet_description: "Atur kata sandi untuk dompet Anda",
          set_a_password_for_your_wallet_button: "Atur Kata Sandi Sekarang",
          backup_your_seedphrase_description: "Cadangkan frase seed Anda",
          backup_your_seedphrase_button: "Cadangkan Sekarang",
          stake_5_near_in_meteor_validator: "Stake",
          stake_5_near_in_meteor_validator_description: "Stake 5 NEAR di Validator Meteor",
        },
      },
      wallet_link: {
        wallet_link: "Tautan Dompet",
        pick_wallet_to_link: "Pilih dompet yang ingin Anda tautkan",
        link_selected_account: "Tautkan Akun yang Dipilih",
        linked_to: "Tertaut ke",
        button_back_to_home: "Kembali ke Dompet",
        modal: {
          title: "Periode Penguncian",
          description:
            "Harap dicatat bahwa Anda hanya dapat mengubah dompet yang tertaut 72 jam setelah perubahan terakhir.",
          button_confirm: "Konfirmasi Tautan Akun",
          button_back: "Kembali",
        },
      },
      wallet_link_select_primary: {
        primary_wallet_explanation:
          "Semua penghasilan rujukan dikirim ke dompet utama Anda. Dompet ini juga memiliki keuntungan tidak ada biaya transaksi.",
        confirm_primary_wallet: "KONFIRMASI DOMPET UTAMA",
        primary_wallet: "DOMPET UTAMA",
      },
      new_onboarding: {
        label_player_name: "NAMA PEMAIN",
        label_creating_account: "MEMBUAT AKUN",
        label_linking_telegram: "MENGGABUNGKAN DENGAN TELEGRAM",
        label_not_enough_balance: "SALDO TIDAK CUKUP",
        label_adding_access_key: "MENAMBAHKAN KUNCI AKSES",
        label_initializing_account: "MENGATUR AKUN",
        text_disclaimer_starting:
          "Pastikan dompet Anda memiliki {startingFee} NEAR untuk biaya jaringan",
        text_disclaimer_consumed:
          "Biaya kecil sebesar {consumedNetworkFee} NEAR akan digunakan untuk biaya jaringan dan penyimpanan",
        button_create_account: "BUAT AKUN",
        button_next: "BERIKUTNYA",
        button_start: "MULAI",
        modal: {
          deposit: {
            title: "Siap untuk MOON?",
            description:
              "Pastikan Anda telah memverifikasi TG Anda atau memiliki akun deposit dengan NEAR untuk memulai",
            text_your_telegram_has_been_linked: "Telegram Anda sudah memiliki dompet utama",
            label_or: "atau",
            button_verify_telegram_account: "Verifikasi Akun Telegram",
            button_deposit_near: "Deposit {startingFeeDisplayed} NEAR",
          },
          insufficient_balance: {
            title: "🔥 Ooops, NEAR tidak cukup untuk Gas",
            description_1: "Sebagian besar transaksi biayanya kurang dari 0,01 NEAR.",
            description_2:
              "Namun, protokol NEAR menggunakan estimasi gas pesimis untuk menutupi skenario terburuk selama waktu puncak.",
            description_3: "Pastikan Anda memiliki",
            description_4: "setidaknya 0,2 NEAR",
            description_5: "di dompet Anda untuk menikmati pengalaman yang lancar.",
            button_top_up: "Dapatkan Lebih Banyak Near Sekarang",
          },
        },
      },
      maintenance: {
        title: "Pembaruan Game Sedang Berlangsung",
        description:
          "Harvest Moon sementara dihentikan untuk peningkatan kontrak untuk memberikan Anda pengalaman yang lebih lancar.",
        footer: "Kami akan kembali dalam kurang lebih 4 jam—terima kasih atas kesabaran Anda!",
        label_migration_notice: "Pemberitahuan Migrasi",
        button_learn_more: "Pelajari Lebih Lanjut",
      },
      social_onboarding: {
        join_telegram: "GABUNG DI CHANNEL TELEGRAM KAMI",
        join_twitter: "IKUTI METEOR DI X",
        complete_to_start: "Lengkapilah langkah-langkah di bawah ini untuk memulai",
        ready_to_start: "Siap untuk memulai!",
        start: "MULAI",
      },
      landing: {
        title: "ANDA TIDAK DILISTING PUTIH",
        button_apply_now: "AJUKAN SEKARANG",
        button_back_to_meteor: "KEMBALI KE METEOR",
      },
      main: {
        text_wallet_address: "ALAMAT DOMPET",
        text_total_moon_token: "Total Token $MOON",
        text_max: "MAKS",
        text_per_hour: "$MOON/JAM",
        text_harvesting: "PANEN",
        text_full_moon: "BULAN PENUH",
        text_moon_balance: "SALDO",
        warning_connect_telegram:
          "Hubungkan akun Telegram Anda untuk mendapatkan biaya gas gratis 10 per hari!",
        warning_save_credentials:
          "Harap simpan frasa benih dan kunci pribadi Anda untuk menghindari kehilangan progres Anda!",
        warning_storage_full: "RUANG PENYIMPANAN PENUH",
        button_harvest: "Panen",
        button_next_harvest: "PANEN SELANJUTNYA",
        button_harvest_moon: "PANEN $MOON",
        button_to_wallet: "KE DOMPET",
      },
      onboarding: {
        main: {
          title: "PEMULA",
          description:
            "Bab baru Anda dalam Dunia Meteor Wallet menunggu! Selesaikan beberapa langkah sederhana untuk memulai petualangan Anda.",
          label_link_telegram: "HUBUNGKAN AKUN TELEGRAM",
          description_link_telegram:
            "Hubungkan dompet ke telegram untuk mendapatkan permainan tanpa biaya gas!",
          label_add_access_key: "TAMBAHKAN KUNCI AKSES",
          description_add_access_key:
            "Tambahkan izin (akses panggilan fungsi) ke akun Anda untuk pengalaman Harvest Moon.",
          label_initialize_account: "INISIASI AKUN",
          description_initialize_account: "Inisialisasi akun permainan Anda dengan Tinker gratis.",
          label_go_to_moon: "PERGI KE BULAN",
          description_go_to_moon: "Perjalanan bulan Anda sudah disiapkan; mulailah panen sekarang.",
          message_linked: "Terkait dengan",
          message_linked_no_tg: "Dompet terhubung ke akun Telegram lain",
          message_not_linked: "Akun Telegram tidak terhubung",
          message_tg_linked: "Telegram terhubung ke dompet ini",
          message_gas_free: "Anda memenuhi syarat untuk bermain tanpa biaya gas",
          message_network_fee:
            "Biaya jaringan kecil diperlukan untuk akun yang tidak diverifikasi oleh Telegram",
          message_deposit_fee: "Ini memerlukan deposit penyimpanan NEAR sebesar 0,003",
          warning_wallet_already_linked:
            "Dompet telah terhubung ke akun Telegram lainnya. Silakan gunakan dompet lain.",
          button_link: "HUBUNGKAN SEKARANG",
          button_add: "TAMBAHKAN SEKARANG",
          button_init: "INISIASI SEKARANG",
          button_go: "PERGI SEKARANG",
        },
        warning: {
          title: "HUBUNGKAN DOMPET ANDA KE TELEGRAM",
          text_basic_union_contract: "kontrak serikat dasar",
          text_gas_free: "Bebas gas",
          text_transaction: "transaksi",
          text_new_access_key_required:
            "Kunci akses baru diperlukan untuk Harvest Moon yang diperbarui",
          message:
            "Dengan menghubungkan dompet Anda ({wallet_id}) ke akun Telegram ({username}), hadiah rujukan yang telah Anda kumpulkan akan diklaim. Menghubungkan ke Telegram akan memberikan Anda manfaat di bawah ini:",
          warning: "Hadiah tidak dapat dipindahkan setelah diklaim",
          button_proceed: "Lanjutkan",
          button_cancel: "Batal",
        },
        step_1: {
          message:
            "Selamat datang di Harvest Moon—babak baru Anda dalam alam semesta Meteor Wallet menanti! Apakah Anda siap untuk memulai perjalanan ini dan mengklaim hadiah Anda?",
          button_continue: "KLIK UNTUK MELANJUTKAN",
        },
        step_2: {
          message_not_verified:
            "Mari atur akun Anda, cepat dan mudah—hanya akan memakan waktu 30 detik. Siap?",
          message_verified:
            "Pertama, kita akan segera mengatur akun Anda—hanya memakan waktu 30 detik. Tanpa kaitan dengan Telegram, ada biaya jaringan kecil (kira-kira 0,003N) untuk transaksi. Siap untuk memulai?",
          option_continue: "Ya, mari kita mulai",
          option_cancel: "Tidak, bawa saya kembali ke Meteor Wallet",
        },
        step_3: {
          message:
            "Untuk memulai, kami akan menambahkan kunci akses fungsional ke akun Anda, memungkinkan interaksi yang lancar dengan kontrak Harvest Moon.",
          button_continue: "Ayo lakukan",
          button_try_again: "Coba Lagi",
        },
        step_4: {
          message_setting_up_account:
            "Hebat, akun Anda sedang diatur. Bersabarlah sementara kami menyiapkan segalanya!",
          message_not_enough_balance:
            "Anda tidak memiliki cukup saldo untuk menginisialisasi akun. Harap isi ulang akun Anda dengan NEAR dan coba lagi.",
          option_try_again: "Coba Lagi",
          option_back: "Kembali",
        },
        step_5: {
          message: "Semuanya siap! Mari menuju KE BULAN!",
          button_ok: "Baiklah",
        },
      },
      tab: {
        title: {
          harvest: "PANEN",
          tinker: "TINKER",
          upgrade: "TINGKATKAN",
          mission: "MISI",
        },
        lumen_lab: {
          title_lab_stats: "STATISTIK LAB",
          label_container: "KONTAINER",
          text_upgrade_container:
            "GUNAKAN TOKEN $MOON UNTUK MENAIKKAN KONTAINER ANDA, UNTUK PANEN YANG LEBIH LAMA",
          label_lab_capacity: "KAPASITAS LAB",
          text_upgrade_lab:
            "GUNAKAN TOKEN $MOON UNTUK MENAIKKAN KAPASITAS LAB ANDA UNTUK MEREKRUT LEBIH BANYAK TINKERS",
          text_hour: "JAM",
          text_moonlight_storage: "PENYIMPANAN CAHAYA BULAN",
        },
        tinker_recruitment: {
          text_moon_per_hour: "$MOON/JAM",
          text_active_tinkers: "TINKERS AKTIF",
          text_total_tinkers: "TOTAL TINKERS",
          text_lab_capacity: "KAPASITAS LAB",
          text_available_union_contracts: "Kontrak serikat yang tersedia",
          warning_min_tinker_count: "Rekrut setidaknya 1 Tinker",
          button_recruit: "REKRUT",
        },
        portal_referral: {
          text_coming_soon:
            "Rincian lebih lanjut tentang teman-teman Anda akan ditampilkan di sini segera.",
          text_my_frens: "TEMAN-TEMAN SAYA",
          text_moon_earned: "$MOON DITAMBAHKAN",
          warning_no_telegram: "Hubungkan akun Telegram Anda untuk mengundang teman-teman Anda!",
          warning_link_telegram:
            "Tautkan dompet Anda ke Telegram untuk mengakses tautan rujukan dan mulai mendapatkan hadiah",
          button_share_on_tg: "BAGIKAN DI TG",
          button_share_on_x: "BAGIKAN DI X",
          button_copy_referral_link: "SALIN TAUTAN PENGANTAR",
          button_link_to_telegram: "Tautan ke Telegram",
          content_share_on_x: `Panen MOON? Ini adalah cara termudah untuk bermain & mendapatkan di dunia kripto - didukung oleh @MeteorWallet

🚀 Dapatkan: $MOON = Meteor #airdrops

Siap untuk bergabung?
👇3 klik pertama memenangkan tiket emas untuk Beta`,
          content_share_on_tg: `Panen MOON? Ini adalah cara termudah untuk bermain & mendapatkan di dunia kripto - didukung oleh Meteor Wallet

🚀 Dapatkan: $MOON = Meteor #airdrops

Siap untuk bergabung?
👇3 klik pertama memenangkan tiket emas untuk Beta`,
        },
        setting: {
          warning_link_telegram_success: "Akun Telegram berhasil terhubung",
          button_link_to_telegram: "HUBUNGKAN DOMPET KE TELEGRAM",
          button_give_feedback: "BERI MASUKAN",
          button_view_secret_phrase: "LIHAT FRASA RAHASIA",
          button_export_private_key: "EKSPOR KUNCI PRIBADI",
          button_quit_game: "KELUAR DARI PERMAINAN",
        },
      },
      modal: {
        unopen_reward: {
          title: "Selamat!",
          description: "Anda telah mendapatkan",
          button_cool: "Keren!",
          reward_id: "ID Hadiah",
          from: "Dari",
        },
        link_to_telegram: {
          title: "LINK KE TELEGRAM",
          description:
            "Dapatkan pembaruan game langsung dan menjadi layak untuk program rujukan kami",
          text_dont_show_again: "Jangan tampilkan ini lagi",
          button_link_wallet: "LINK DOMPET",
        },
        upgrade: {
          container: {
            title: "TINGKATKAN PENYIMPANAN",
            description:
              "GUNAKAN TOKEN $MOON UNTUK MENINGKATKAN KONTAINER ANDA UNTUK PANEN LEBIH LAMA",
          },
          lab: {
            title: "TINGKATKAN LAB",
            description:
              "GUNAKAN TOKEN $MOON UNTUK MENINGKATKAN LAB ANDA UNTUK MEREKRUT LEBIH BANYAK TINKERS",
          },
          label_current_level: "TINGKAT SAAT INI",
          label_upgrade_level: "TINGKAT PENINGKATAN",
          text_moon: "$MOON",
          button_upgrade: "TINGKATKAN",
        },
        maintenance: {
          title: "PEMBERITAHUAN PERAWATAN",
          description:
            "Kami telah berhasil bermigrasi ke kontrak pintar baru untuk meningkatkan pengalaman bermain Anda. Jika saldo Tinkers atau $MOON Anda tidak tampak benar, beri tahu kami.",
          button_report_issue: "Laporkan Masalah",
        },
        leaderboard: {
          title: "Papan Peringkat",
          loading: "Mengambil data papan peringkat",
          text_rank: "Peringkat",
          text_player_name: "Nama Pemain",
          text_moon_hr_rate: "$MOON/Jam",
          text_total_players: "Total {count} Pemain",
          button_close: "TUTUP",
          label_boost: "Dorongan",
          button_rank_higher: "Tips untuk peringkat lebih tinggi",
          button_share: "Bagikan",
          mission_menu_title: {
            SWAP_TO: "Misi Perdagangan Memecoin",
            HM_TIME_TRAVEL: "Misi Perjalanan Waktu",
            BRIDGE_FROM: "Misi Penghubung",
          },
          mission_value1_title: {
            SWAP_TO: "Volume Perdagangan",
            HM_TIME_TRAVEL: "Perjalanan Waktu",
            BRIDGE_FROM: "Volume Jembatan",
          },
          streak: "Garis",
          tinker_lab_rankings: "Peringkat Lab Tinker",
          streak_rankings: "Peringkat Beruntun",
        },
        promo: {
          title: "🌕 Bergabunglah dengan Harvest MOON!",
          description_1: "Cara baru dan mudah untuk bermain & mendapatkan di dunia kripto:",
          description_2: "🎮 Mainkan: Tugas-tugas menyenangkan untuk hadiah",
          description_3: "🌙 Panen: Dapatkan token $MOON",
          description_4: "🚀 Hasil: $MOON = Udara meteor",
          button_go: "Ayo pergi!",
        },
        menu: {
          title: {
            [EHarvestMoon_Menu.home]: "",
            [EHarvestMoon_Menu.lab]: "LAB LUMEN",
            [EHarvestMoon_Menu.tinker]: "PENGGUNAAN TINKER",
            [EHarvestMoon_Menu.referral]: "PORTAL REFERAL",
            [EHarvestMoon_Menu.quest]: "TANTANGAN KRIPTO",
            [EHarvestMoon_Menu.setting]: "PENGATURAN",
          },
          description: {
            [EHarvestMoon_Menu.home]: "",
            [EHarvestMoon_Menu.lab]:
              "Tingkatkan kontainer Anda untuk periode panen yang lebih lama dan tingkatkan kapasitas lab untuk merekrut lebih banyak Tinkers.",
            [EHarvestMoon_Menu.tinker]:
              "Gunakan kontrak untuk rekrutmen berbasis peluang dari Tinker yang memanen cahaya bulan dengan tarif yang bervariasi.",
            [EHarvestMoon_Menu.referral]:
              "Setiap fren yang diundang akan menghasilkan Anda Kontrak Serikat Dasar + 20% dari $MOON mereka, selamanya.",
            [EHarvestMoon_Menu.quest]:
              "Misi yang meningkatkan keterampilan kripto Anda dan memanfaatkan kekuatan DeFi untuk keuntungan Anda.",
            [EHarvestMoon_Menu.setting]: "",
          },
        },
        harvest_summary: {
          not_eligible: "Tidak memenuhi syarat",
          label_click_to_reveal_prize: "Klik untuk Mengungkap Hadiah",
          label_you_have_won: "Anda telah memenangkan sebuah",
          label_and_token_drop: "dan sebuah token",
          label_won_token_drop: "Anda memenangkan sebuah token",
          button_click_to_continue: "Klik untuk melanjutkan",
          contract_type: {
            basic: "KONTRAK DASAR",
            advanced: "KONTRAK LANJUTAN",
            expert: "KONTRAK AHLI",
          },
          title: "Ringkasan Panen",
          description:
            "Panen Anda selesai! Lihat bagaimana kinerja Tinkers Anda dan apakah Anda memenuhi syarat untuk kontrak atau token drop",
          congratulations: "Selamat",
          contract_drop: "Penurunan Kontrak",
          token_drop_campaign: "Penurunan Token",
          criteria_not_met_title: "Kriteria tidak terpenuhi",
          criteria_not_met_desc:
            "Anda tidak memenuhi kriteria kampanye, ingin bagian Anda dari $25K USDC?",
          win_rate: "Tingkat Keberhasilan",
          better_luck_next_time_title: "Semoga beruntung lain kali",
          better_luck_next_time_desc_1: "Tingkatkan peluang Anda dengan meningkatkan akun Anda",
          better_luck_next_time_desc_2: "Penurunan token selalu memiliki peluang 50/50",
          you_have_won: "Anda telah menang",
          learn_more: "Pelajari Lebih Lanjut",
          you_got: "Anda mendapatkan",
          view_more: "Lihat Lebih Banyak",
          traded: "Diperdagangkan",
          text_upgrade_container:
            "Penyimpanan $MOON yang lebih tinggi meningkatkan tingkat penurunan dan ukuran panen Anda.",
          text_upgrade_tier: {
            one: "Level 1 – Anda hanya memenuhi syarat untuk Kontrak Dasar.",
            two: "Level 2 – Anda memenuhi syarat untuk Kontrak Dasar dan Lanjutan.",
            three: "Level 3 – Anda memenuhi syarat untuk Kontrak Dasar, Lanjutan, dan Ahli.",
          },
          subtitle: "TERIMA PANEN",
          label_container_size: "WAKTU TOTAL",
          label_lab_capacity: "LABORATORIUM LUMEN",
          label_total_moon_tokens: "TOTAL $MOON",
          text_moon: "$MOON",
          text_moon_harvested: "Dipanen",
          text_moon_per_hour: "$MOON / Jam",
          text_union_contract_chance: "UNDIAN KONTRAK SERIKAT BURUH!",
          text_harvest_and_win: "PANEN & MENANG",
          text_tinkers: "Perakit",
          text_get_referral:
            "Dapatkan hadiah dengan membagikan ini di X! (termasuk tautan referral)",
          label_win: "SELAMAT",
          text_win: "Anda telah memenangkan {contract_type}!",
          label_lose: "NEXT TIME!",
          text_lose: "PANEN LAGI UNTUK PELUANG KONTRAK SERIKAT!",
          button_close: "Tutup",
          share_on_x: "Bagikan di X",
          rank: "Peringkat",
          content_share_on_x: `Ringkasan Panen Terbaru saya: Tinkers membantu saya mengumpulkan token $MOON gratis untuk airdrop di masa depan

Apa itu Harvest Moon? Cara termudah untuk bermain dan menghasilkan kripto, semuanya melalui @MeteorWallet

𝗦𝗶𝗮𝗽 𝘂𝗻𝘁𝘂𝗸 𝗯𝗲𝗿𝗴𝗮𝗯𝘂𝗻𝗴?
3 klik pertama memenangkan tiket emas untuk Beta`,
          label_upgrade_your_account: "Tingkatkan akun Anda",
          label_harvesting_longer_hours: "Panen lebih lama",
          label_enhance_your_moon_container: "Tingkatkan Kontainer MOON Anda",
          button_upgrade: "Tingkatkan Sekarang",
          button_enhance: "Tingkatkan Sekarang",
          label_next_time: "KALI BERIKUTNYA!",
          text_next_time: "Ups, tingkatkan peluang Anda untuk mengamankan kontrak union dengan:",
          label_new_moon_balance: "Saldo $MOON",
          label_drop_rate: "Tingkat Drop",
          hint_drop_rate:
            "Semakin lama Anda memanen, semakin tinggi tingkat drop kontrak Anda. Selain itu, level pemain Anda dan peningkatan kontainer juga memengaruhi drop kontrak Anda.",
          label_no_drop: "Tidak Ada Drop",
          label_drop: "Jatuhkan",
          reward: "Hadiah",
          result: "Hasil",
          win: "Menang",
          try_again: "Coba Lagi",
          win_odd: "Tingkat Keberhasilan",
          random_odd: "Peluang Lemparan",
        },
        recruitment: {
          text_recruit_with: "REKRUT DENGAN",
          text_tinkers_to_recruit: "Berapa banyak Tinkers yang ingin Anda rekrut?",
          warning_max_tinker_count: "Anda hanya dapat merekrut maksimum ",
          button_use_max: "GUNAKAN MAKS",
          button_recruit: "REKRUT",
        },
        recruitment_reveal: {
          text_the: "YANG",
          text_moon_per_hour: "$MOON / JAM",
          button_skip: "LEWAT",
          button_click_to_continue: "KLIK UNTUK MELANJUTKAN",
        },
        recruitment_summary: {
          title: "RINGKASAN REKRUTMEN",
          text_mph: "MPH",
          text_new_mph: "MPH BARU",
          button_ok: "OK",
          share_on_x: "BAGIKAN DI X",
          label_max_capacity_reached: "Kapasitas lab maksimum tercapai",
          button_details: "Detail",
          button_upgrade_lab: "Tingkatkan Lab Sekarang",
          content_share_on_x: `Rekrutmen Tinker baru saya: mereka membantu saya mengumpulkan token $MOON gratis untuk airdrop di masa depan

Apa itu Harvest Moon? Cara termudah untuk bermain dan menghasilkan kripto, semuanya melalui @MeteorWallet

𝗦𝗶𝗮𝗽 𝘂𝗻𝘁𝘂𝗸 𝗯𝗲𝗿𝗴𝗮𝗯𝘂𝗻𝗴?
3 klik pertama memenangkan tiket emas untuk Beta`,
          text_get_more_contract: "DAPATKAN LEBIH BANYAK KONTRAK DENGAN MEMBAGIKAN INI DI X",
          text_referral_link: "TAUTAN REFERRAL OTOMATIS DITAMBAHKAN",
        },
        fusion_summary: {
          title: "Ringkasan Perjalanan Waktu",
          label_total_travelled: "Total Perjalanan",
          label_total_success: "Total Berhasil",
          label_total_failed: "Total Gagal",
        },
        account_verified: {
          title: "AKUN TERVERIFIKASI",
          description: "Akun Telegram Anda telah diverifikasi.",
          button_ok: "OK",
        },
        coming_soon: {
          title: "SEGERA HADIR",
        },
        warning: {
          title: "PERINGATAN",
          button_ok: "OK",
        },
        production_guide: {
          title: "PANEN CAHAYA BULAN",
          text_moon_per_hour: "$MOON/JAM",
          text_with: "DENGAN",
          text_hour: "JAM",
          text_container: "KONTAINER",
          text_max_harvest: "PANEN MAKS",
          text_get_more_moon: "Lebih banyak $MOON/jam?",
          text_get_more_hours: "Lebih banyak jam? ",
          link_get_tinkers: "Dapatkan Tinkers",
          link_upgrade_container: "Tingkatkan Kontainer",
        },
        storage_guide: {
          title: "PENYIMPANAN CAHAYA BULAN",
          link_upgrade_container: "Tingkatkan Kontainer",
          text_your_storage: "PENYIMPANAN ANDA",
          text_full_and_fills: "PENUH DAN MENGISI",
          text_every: "SETIAP",
          text_hours: "JAM",
          text_want_more_hours: "INGIN LEBIH BANYAK JAM?",
        },
        tinker_guide: {
          title: "PETUNJUK PEMBURU",
          text_moon: "$MOON",
          text_harvest_rates: "TINGKAT PANEN",
          text_every_hour: "SETIAP JAM",
        },
      },
      tinker: {
        name: {
          "1": "Magang",
          "2": "Peneliti",
          "3": "Ilmuwan",
          "4": "Jenius",
          "5": "Otak",
        },
      },
      contract: {
        name: {
          [EHM_UnionContractTypes.basic]: "Dasar",
          [EHM_UnionContractTypes.advanced]: "Lanjutan",
          [EHM_UnionContractTypes.expert]: "Ahli",
        },
        fullname: {
          [EHM_UnionContractTypes.basic]: "KONTRAK DASAR",
          [EHM_UnionContractTypes.advanced]: "KONTRAK LANJUTAN",
          [EHM_UnionContractTypes.expert]: "KONTRAK AHLI",
        },
        description: {
          [EHM_UnionContractTypes.basic]: "Rekrut sebagian besar Intern, kadang-kadang Peneliti",
          [EHM_UnionContractTypes.advanced]: "Rekrut kebanyakan Ilmuwan, kadang-kadang Geniuses",
          [EHM_UnionContractTypes.expert]: "Rekrut sebagian besar Genius, kadang-kadang Otak",
        },
      },
      tinker_phase: {
        title: {
          [EHarvestMoon_TinkerGuideModalPhase.active_tinker]: "TINKERS AKTIF",
          [EHarvestMoon_TinkerGuideModalPhase.union_contract]: "KONTRAK SERIKAT",
        },
        description: {
          [EHarvestMoon_TinkerGuideModalPhase.active_tinker]:
            "Lebih banyak Tinkers daripada ruang? Kami mempekerjakan yang terbaik. Pastikan laboratorium Anda memiliki ruang untuk mendapatkan yang terbaik dari Tinkers Anda.",
          [EHarvestMoon_TinkerGuideModalPhase.union_contract]:
            "Gunakan kontrak untuk rekrutmen berbasis peluang dari Tinker yang memanen cahaya bulan dengan tarif yang bervariasi.",
        },
      },
      share: {
        telegram: `𝗦𝗶𝗮𝗽𝗮 𝗮𝗻𝗱𝗮 𝗺𝗲𝗺𝗮𝗻𝗴𝗶𝗹𝗸𝗮𝗻 𝗵𝗮𝗿𝗶 𝗣𝗮𝗻𝗲𝗻? Saya baru bergabung dan ini adalah cara termudah untuk bermain & mendapatkan dalam dunia kripto - didukung oleh Meteor Wallet.
  
🎮 𝗠𝗮𝗶𝗻: Tugas-tugas menyenangkan untuk hadiah

🌙 𝗛𝗮𝗿𝘃𝗲𝘀𝘁: Ambil token $MOON

🚀 𝗘𝗮𝗿𝗻: $MOON = airdrops Meteor

𝗦𝗶𝗮𝗽 𝘂𝗻𝘁𝘂𝗸 𝗯𝗲𝗿𝗴𝗮𝗯𝘂𝗻𝗴?
3 klik pertama memenangkan tiket emas untuk Beta
`,
      },
    },
    common: {
      transaction_not_safe_ids: {
        [ETransactionNotSafeId.not_safe_delete_account]: {
          title: "Deteksi Penghapusan Akun",
          desc: "Tampaknya ada aplikasi eksternal yang mencoba menghapus akun Anda dalam transaksi ini. Kami mencegah eksekusi transaksi ini. Silakan gunakan Meteor Wallet langsung jika Anda ingin menghapus akun Anda.",
        },
        [ETransactionNotSafeId.not_safe_deploy_contract]: {
          title: "Deteksi Penyediaan Kontrak",
          desc: "Tampaknya ada aplikasi eksternal yang mencoba menyediakan kontrak ke akun Anda dalam transaksi ini. Tindakan ini tidak aman. Kami mencegah eksekusi transaksi ini.",
        },
        [ETransactionNotSafeId.not_safe_add_key_full_access]: {
          title: "Deteksi Penambahan Kunci Akses Penuh",
          desc: "Tampaknya ada aplikasi eksternal yang mencoba menambahkan kunci akses penuh ke akun Anda dalam transaksi ini. Hal ini akan memungkinkan mereka menguras akun Anda. Kami mencegah eksekusi transaksi ini.",
        },
        [ETransactionNotSafeId.not_safe_delete_key_full_access]: {
          title: "Deteksi Penghapusan Kunci Akses Penuh",
          desc: "Tampaknya ada aplikasi eksternal yang mencoba menghapus kunci akses penuh dari akun Anda dalam transaksi ini. Hal ini dapat mencegah Anda mengakses akun Anda. Kami mencegah eksekusi transaksi ini.",
        },
      },
      error_ids: {
        [EOldMeteorErrorId.merr_account_access_key_not_found]:
          "Tidak dapat menemukan kunci akses akun.",
        [EOldMeteorErrorId.merr_sign_message_verify_mismatch]:
          "Verifikasi gagal. Tanda tangan tidak cocok.",
        [EOldMeteorErrorId.merr_account_signed_request_mismatch]:
          "Verifikasi gagal. Ketidakcocokan terdeteksi dalam permintaan yang ditandatangani.",
        [EOldMeteorErrorId.merr_account_signed_request_not_full_access_key]:
          "Permintaan tidak sesuai dengan kunci akses penuh.",
        [EOldMeteorErrorId.merr_enrollment_failed]: "Pendaftaran Misi Gagal",
        [EOldMeteorErrorId.merr_enrollment_failed_no_gas]:
          "Saldo tidak mencukupi. Harap isi ulang untuk melanjutkan.",
        [EOldMeteorErrorId.merr_reward_redeem_failed]:
          "Transaksi gagal. Tidak dapat menebus hadiah.",
        [EOldMeteorErrorId.merr_reward_redeem_failed_no_gas]:
          "Saldo tidak mencukupi. Harap isi ulang untuk melanjutkan.",
        [EOldMeteorErrorId.merr_reward_claim_ft_failed]:
          "Pengajuan klaim hadiah token tidak berhasil.",
        [EOldMeteorErrorId.merr_reward_claim_ft_failed_no_gas]:
          "Saldo tidak mencukupi. Harap isi ulang untuk melanjutkan.",
        [EOldMeteorErrorId.merr_reward_claim_nft_failed]:
          "Pengajuan klaim hadiah NFT tidak berhasil.",
        [EOldMeteorErrorId.merr_reward_claim_nft_failed_no_gas]:
          "Saldo tidak mencukupi. Harap isi ulang untuk melanjutkan.",
        [EOldMeteorErrorId.merr_unwrap_near_failed]: "Proses pembukaan NEAR tidak berhasil.",
        [EOldMeteorErrorId.merr_profile_update_failed]: "Pembaruan profil tidak berhasil.",
        [EOldMeteorErrorId.merr_profile_update_pfp_failed]:
          "Pembaruan gambar profil tidak berhasil.",
        [EErrorId_AccountSignerExecutor.signer_executor_stale_execution]:
          "Eksekusi usang. Upaya eksekusi proses yang sudah kedaluwarsa.",
        [EErrorId_AccountSignerExecutor.signer_executor_execution_cancelled]:
          "Eksekusi dibatalkan. Penghentian proses yang diinisiasi oleh pengguna.",
        [EErrorId_AccountSignerExecutor.signer_executor_execution_not_finished]:
          "Eksekusi terputus. Proses belum selesai.",
        [EErrorId_AccountSignerExecutor.signer_executor_only_cancel_async_signing]:
          "Pembatalan ditolak. Proses penandatanganan asinkron tidak dapat dibatalkan.",
        [EErrorId_AccountSignerExecutor.signer_executor_ordinal_state_nonexistent]:
          "Kesalahan Eksekutor Penandatangan: Status Ordinal Tidak Ada",
        [EErrorId_AccountSignerExecutor.signer_executor_step_index_nonexistent]:
          "Kesalahan Eksekutor Penandatangan: Indeks Langkah Tidak Ada",
        [EErrorId_AccountSignerExecutor.publishing_transaction_not_signed]:
          "Transaksi belum ditandatangani. Penandatanganan ditolak pada perangkat Ledger.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed]:
          "Gagal melakukan transaksi. Proses penerbitan tidak berhasil.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome]:
          "Gagal melakukan transaksi. Proses penerbitan tidak berhasil.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome]:
          "Gagal melakukan transaksi. Proses penerbitan tidak berhasil.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error]:
          "Gagal melakukan transaksi. Proses penerbitan tidak berhasil.",
        [EErrorId_AccountSignerExecutor.publishing_delegated_transaction_failed]:
          "Gagal melakukan transaksi. Proses penerbitan tidak berhasil.",
        [EErr_NearLedger.ledger_user_rejected_action]:
          "Pengguna menolak tindakan pada perangkat Ledger.",
        [EErr_NearLedger.ledger_invalid_data_received]:
          "Data tidak valid. Data yang diterima dari Ledger tidak benar atau rusak.",
        [EErr_NearLedger.ledger_transaction_data_too_large]:
          "Data melebihi batas. Ukuran data transaksi terlalu besar untuk Ledger.",
        [EErr_NearLedger.ledger_unknown_transport_error]:
          "Kesalahan transportasi. Masalah transmisi data yang tidak diketahui dengan Ledger.",
        [EErr_NearLedger.ledger_device_locked]:
          "Perangkat terkunci. Harap buka kuncinya dan coba lagi.",
        [EErr_NearLedger.ledger_near_app_not_open]:
          "Perangkat di aplikasi Near tidak terbuka. Harap buka di Ledger Anda dan coba lagi.",
        [EErr_NearLedger.ledger_device_unknown_error]:
          "Kesalahan yang tidak diketahui. Masalah yang tidak teridentifikasi dengan perangkat Ledger.",
      },
      errors: {
        title_unknown_error: "Kesalahan Tidak Dikenal",
        desc_unknown_error: "Terjadi kesalahan yang tidak dikenal. Harap beritahu tim Meteor.",
      },
      maintenance: {
        title_maintenance: "Kami sedang dalam perawatan",
        desc_maintenance:
          "Harap cek kembali segera, kami sedang melakukan sedikit perbaikan pada beberapa pembaruan yang menarik.",
      },
    },
    services: {
      near: {
        networkNames: {
          [ENearNetwork.testnet]: "Testnet",
          [ENearNetwork.betanet]: "Betnet",
          [ENearNetwork.mainnet]: "jaringan utama",
          [ENearNetwork.localnet]: "jaringan area lokal",
        },
        networkNamesShort: {
          [ENearNetwork.testnet]: "Test",
          [ENearNetwork.betanet]: "Bet",
          [ENearNetwork.mainnet]: "Utama",
          [ENearNetwork.localnet]: "Lokal",
        },
      },
      refresh: {
        refreshText: "Menyegarkan",
        updatingText: "Memperbarui",
      },
      copy: {
        common: "Disalin {data}",
        copy_id: "Salin ID dompet",
        wallet: "Salinan ID Dompet",
      },
      delete: {
        common: "Hapus akun",
        delete: "Menghapus",
        cancel: "Membatalkan",
        delete_this_account: "Hapus akun ini",
        delete_this_account_note: "Yakin ingin menghapus akun ini dari dompet Anda?",
      },
      fund: {
        almost_there: "Hampir sampai !",
        check_now: "Cek sekarang",
        checking: "Memeriksa...",
        send_at_least: "Kirim setidaknya 0,1 Dekat ke alamat dompet Anda untuk mengaktifkan akun",
        fund_via_testnet: "Dana melalui Testnet",
        checking_again_in: "Memeriksa lagi",
        error_occurred: "Terjadi kesalahan saat menanyakan status dompet",
      },
      user: {
        needLogin: "Anda perlu masuk untuk melakukan itu.",
      },
    },
    buttonText: {
      createNewAccount: "Buat dompet baru",
      importAccount: "Impor dompet yang ada",
      updateText: "Memperbarui",
      continueText: "Melanjutkan",
      confirmText: "Konfirmasi",
      createWallet: "Buat Dompet",
    },
    sidebarUi: {
      button_addWallet: "Tambahkan Dompet",
      button_settings: "Pengaturan",
      button_signOut: "Kunci Dompet",
      noWalletBlurb: "Buat atau impor dompet baru untuk memulai",
      notSignedInBlurb: "Masuk untuk mengakses dompet Anda",
    },
    mainUi: {
      menu_button_wallets: "Dompet",
      heading_myAssets: "Aset Saya",
      button_deposit: "Top Up",
      button_send: "Kirim",
      button_stake: "Taruhan",
      button_swap: "Tukar",
      button_explore: "Jelajahi",
      button_bridge: "Jembatan",
      updating: "Memperbarui...",
    },
    pageContent: {
      walletConnect: {
        blurb_noAccountFound:
          "Tidak ditemukan akun Meteor Wallet untuk terhubung ke aplikasi eksternal",
      },
      linkdrop: {
        title_incorrect_link_format: "Oops, terjadi kesalahan",
        description_incorrect_link_format:
          "Format tautan salah. Silakan periksa url Anda dan coba lagi",
        title_drop_claimed: "Drop telah diklaim.",
        description_drop_claimed:
          "NEAR Drop ini sudah diklaim. NEAR Drops hanya dapat digunakan untuk membuat satu akun dan tautan kemudian kedaluwarsa.",
        title_received_drop: "Anda telah menerima NEAR drop!",
        title_received_ft_drop: "Anda telah menerima {symbol} drop!",
        description_received_drop: "Klaim dengan akun yang sudah ada atau buat akun baru",
        claim: "Klaim",
        claim_with_following_account: "Klaim dengan akun berikut:",
        claim_with_new_account: "Klaim dengan akun baru",
        claim_success_title: "Dikonfirmasi",
        claim_success_description: "Anda telah berhasil mengklaim drop",
        claim_success_with_redirect_description:
          "Anda berhasil mengklaim hadiah dan akan segera diarahkan kembali ke aplikasi.",
        something_went_wrong_title: "Terjadi kesalahan",
        something_went_wrong_description: "Silakan coba lagi nanti atau gunakan tautan lain.",
        or: "Atau",
      },
      linkdropClaimedSuccess: {
        title: "Hadiah Diklaim",
        subtitle: "Aset yang dihadiahkan telah berhasil ditambahkan ke dompet Anda!",
        button_redirect: "Kembali ke situs",
      },
      topup: {
        heading_get_near: "Dapatkan $NEAR",
        buy_near: "Beli $NEAR",
        onramper_description: "Agregator yang memiliki semua onramp fiat-to-crypto utama",
        bridge_from_eth_aurora: "Jembatan Dari Ethereum/Aurora",
        rainbow_bridge_description:
          "Menjembatani antara atau mengirim dalam Ethereum DEKAT dan Aurora",
        supported_cex: "Pertukaran Terpusat",
        okx_description: "Temukan crypto di atas salah satu dunia",
        binance_description: "Ekosistem blockchain terkemuka di dunia dan pertukaran aset digital.",
        huobi_description: "Pertukaran Terkemuka Dunia",
        kraken_description: "Kraken adalah jembatan Anda ke dunia kripto.",
      },
      extensionConnect: {
        blurb_extensionInstalled: "Akun Anda sekarang juga dapat diakses melalui ekstensi!",
        title_extensionInstalled: "Ekstensi Meteor Dipasang",
        button_text_continueToApp: "Melanjutkan",
      },
      walletHome: {
        subtext_availableFunds: "Saldo Tersedia",
        tooltip_availableFunds:
          "Saldo Anda yang dapat dibelanjakan tidak termasuk dana yang dikunci ,atau dipertaruhkan.",
        warning_needsRecoveryBackup: "Frasa Pemulihan Dompet Tidak Dicadangkan",
        warning_needsRecoveryBackup_desc:
          "Cadangkan frase awal dompet Anda untuk mencegah hilangnya aset",
        warning_needsRecoveryBackup_btn: "Cadangkan sekarang",
        warning_insecureWallet: "Dompet Tidak Terenkripsi",
        warning_insecureWallet_desc:
          "Tetapkan kata sandi untuk melindungi dompet Anda melalui enkripsi data sensitif",
        warning_insecureWallet_btn: "Perbarui Kata Sandi",
        warning_networkIssue_title: "Masalah Jaringan",
        warning_networkIssue_desc:
          "Jaringan Near Protocol menghadapi kemacetan. Transaksi mungkin lebih lambat dari biasanya dan beberapa fitur mungkin sementara tidak dapat diakses.",
        warning_scamTokenCount: "{count} token penipuan disembunyikan",
        warning_scamTokenCount_multi: "{count} token penipuan disembunyikan",
        warning_hiddenTokenCount: "{count} token saldo kecil disembunyikan",
        warning_hiddenTokenCount_multi: "{count} token saldo kecil disembunyikan",
        button_updates: "Pembaruan",
        tooltip_recent_updates: "Anda dapat menemukan pembaruan terbaru di sini",
        tooltip_total_balance: "Saldo Total",
        tooltip_storage_reserve: "Cadangan Penyimpanan",
        tooltip_gas_reserve: "Cadangan Gas",
        tooltip_spendable: "Dapat Dibelanjakan",
        import_token: {
          title: "Impor Token",
          description: "Masukkan alamat token untuk mengimpor token ke dompet Anda",
          placeholder: "Cari Alamat Token ...",
          button_add_token: "Tambahkan Token yang Dipilih",
          market_price: "Harga Pasar",
          my_balance: "Saldo Saya",
          my_balance_in_usd: "Saldo Saya dalam USD",
          warning_please_enter_token: "Silakan masukkan alamat kontrak token di atas",
          warning_invalid_token: "Alamat token yang Anda masukkan tidak valid",
          toast_title_token_added: "Token Berhasil Ditambahkan",
          toast_text_token_added: "Anda telah berhasil menambahkan token",
        },
      },
      addressBook: {
        text_noAddressesFound: "Tidak Ada Alamat Ditemukan",
        heading_otherOwnedAccounts: "Dompet Anda Lainnya",
        heading_savedAccounts: "Alamat Tersimpan",
        heading_recentlyUsedAccounts: "Alamat yang Terakhir Digunakan",
      },
      walletDeposit: {
        heading_deposit: "Menyetorkan",
        text_copy_wallet: "Salin ID Dompet",
      },
      walletSwap: {
        swap: "Menukar",
        confirm_swap: "Konfirmasi Tukar",
        something_wrong: "Ada yang salah",
        failed_build_transaction: "Gagal membuat transaksi",
        preparing_transaction: "Mempersiapkan transaksi Anda",
        getting_transaction_ready: "Mempersiapkan transaksi Anda.",
        executing_step: "Langkah Eksekusi",
        calling: "Panggilan",
        you_receive: "Anda menerima",
        you_pay: "Anda Membayar",
        swap_successful: "Tukar Berhasil",
        swap_success_desc: "Anda berhasil menukar token Anda",
        swap_failed: "Ditukar Gagal",
        swap_failed_desc:
          "Ada yang salah. Silakan periksa riwayat transaksi Anda untuk lebih jelasnya.",
        close: "Menutup",
        review_swap: "Tukar Tinjauan",
        route_not_found: "Rute Tidak Ditemukan",
        inadequate_balance: "Saldo Tidak Memadai",
        show_all_routes: "Tampilkan semua rute yang tersedia",
        to_contract: "untuk kontrak",
        do_no_close_page: "Harap jangan tutup halaman ini atau segarkan browser Anda",
        provider: "Pemberi",
        price_impact: "Dampak Harga",
        meteor_fee: "Biaya Meteor",
        meteor_fee_desc: "Tanpa Biaya, Hanya Tarif Terbaik",
        provider_fee: "Biaya Penyedia",
        network_fee: "Biaya Jaringan",
        swap_fee: "Biaya Swap",
        route: "Rute",
        minimum_received: "Minimal Diterima",
        best_route: "Rute Terbaik",
        find_token_hint: "Cari token dengan simbol token, nama atau alamat",
        label_swap_details: "Detail Tukar",
        label_please_enter_amount: "Silakan masukkan jumlah",
        label_select_token: "Pilih Token",
        hint_search_token: "Cari simbol token, nama atau alamat",
        label_slippage: "Selip",
        button_confirm: "Konfirmasi",
        title_slippage: "Pengaturan Selip",
        desc_slippage:
          "Transaksi Anda akan gagal jika harga berubah lebih dari selip. Nilai yang terlalu tinggi akan mengakibatkan perdagangan yang tidak menguntungkan.",
        // label_support_fees:
        //   "Kutipan termasuk {METEOR_SWAP_FEE}% biaya Meteor untuk mendukung tim",
        label_support_fees:
          "Kami tidak mengenakan biaya sekarang, tetapi biaya mungkin akan ditambahkan di masa depan.",
        label_loading: "Memuat",
        label_fees: "Biaya",
        label_quote: "Kutipan",
        label_error_message: "Pesan Kesalahan",
        label_successful: "Berhasil",
        description_success:
          "Transaksi Anda berhasil diselesaikan! Token yang ditukar sekarang tersedia di dompet Anda.",
        description_failed:
          "Pertukaran gagal karena pergerakan harga melebihi toleransi slippage Anda (${oldSlippage}%). Coba lagi dengan toleransi yang lebih tinggi (${suggestedSlippage}%).",
        label_swap_summary: "Ringkasan Pertukaran",
        label_you_send: "Anda Mengirim",
        label_you_received: "Anda Menerima",
        button_back_to_home: "Kembali ke Beranda",
        button_back_to_redirect_url: "Kembali ke URL Pengalihan",
        button_try_again: "Coba Lagi",
        title_slippage_error: "Ups, Kesalahan Slippage!",
      },
      walletStake: {
        liquid_staking: "Taruhan Cair",
        standard_staking: "Taruhan Standar",
        liquid_staking_desc:
          "Pertaruhkan DEKAT Anda untuk menerima token taruhan. Anda kemudian dapat menginvestasikan kembali ini.",
        standard_staking_desc: "Kunci DEKAT Anda untuk menerima ~10% APY",
        create_new_staking: "Buat Taruhan Baru",
        create_new_staking_desc: "Dapatkan hadiah sekarang dengan mengunci DEKAT Anda!",
        my_staked_validators: "Validator Stake Saya",
        display_newly_staked_note:
          "Mungkin perlu waktu ~1 menit untuk menampilkan validator yang baru Anda pertaruhkan.",
        search_validator: "Validator penelusuran",
        load_more: "Muat lebih banyak",
        something_wrong: "Ada yang salah",
        staking_failed: "Staking gagal",
        staking_failed_went_wrong: "Staking gagal: terjadi kesalahan",
        unstake_failed_went_wrong: "Unstaking gagal: terjadi kesalahan",
        you_stake: "Anda mempertaruhkan:",
        you_unstake: "Anda Unstake:",
        you_receive: "Anda menerima",
        unstake_failed: "Unstaking gagal",
        staked_success: "Berhasil Dipertaruhkan",
        staked_success_msg: "Anda telah berhasil mempertaruhkan",
        unstaked_success: "Tidak Berhasil",
        unstaked_success_msg: "Anda telah berhasil unstake",
        review_staking: "Taruhan Tinjauan",
        review_unstaking: "Tinjau Unstaking",
        validator_details: "Detail Validator",
        confirm: "Mengonfirmasi",
        close: "Tutup",
        staking: "Mempertaruhkan",
        stake: "Mempertaruhkan",
        unstake: "Lepas pasak",
        to: "Ke",
        from: "Dari",
        create_liquid_staking: "Buat Taruhan Cair",
        liquid_unstake: "Pelepasan Cair",
        inadequate_balance: "Saldo Tidak Memadai",
        minimum_liquid_note: "Jumlah pertaruhan cairan minimum adalah",
        staking_details: "Detail Taruhan",
        you_are_staking: "Anda mempertaruhkan",
        staking_with: "dengan",
        days: "Hari",
        estimated_earnings: "Perkiraan pendapatan",
        select_your_validator_pool: "Pilih Validator/Kumpulan Anda",
        select_validator: "Pilih Validator",
        insufficient_balance: "Saldo tidak mencukupi",
        use_max: "Gunakan Maks",
        available: "Tersedia",
        create_standard_staking: "Buat Taruhan Standar",
        amount_to_unstake_in: "Jumlah untuk membatalkan taruhan",
        active: "Aktif",
        reward_token_s: "Token Hadiah",
        inactive: "Tidak aktif",
        total_staked: "Total Dipertaruhkan",
        estimated_apy: "Estimasi APY",
        staked_near: "Dipertaruhkan DEKAT",
        staked_near_tooltip:
          "Jumlah yang hampir dipertaruhkan. Hadiah token DEKAT secara otomatis dipertaruhkan kembali.",
        unclaimed_reward: "Hadiah yang Tidak Diklaim",
        unclaimed_reward_tooltip:
          "Hadiah yang telah diperoleh, tetapi tidak ditarik. Hadiah token DEKAT secara otomatis diambil kembali.",
        you_unstaking: "Anda tidak mempertaruhkan",
        usually_take_72_hour_unstake: "dan biasanya diperlukan waktu 48~72 jam untuk melepas pasak",
        unstaked_ready_to_claimed: "Dana Anda yang tidak dipertaruhkan siap untuk diklaim",
        claim_unstaked: "Klaim Tanpa Taruhan",
        stake_more: "Pertaruhkan Lebih Banyak",
        claim_reward: "Klaim Hadiah",
        provider: "Pemberi",
        liquid_unstake_fee: "Biaya Unstake Cair",
        unlock_period: "Periode Buka Kunci",
        total_near_staked: "Total DEKAT Dipertaruhkan",
        balance: "Keseimbangan",
        value_in_near: "Nilai dalam DEKAT",
        and_it_usually_takes: "dan biasanya memakan waktu",
        to_unstake: "untuk melepaskan taruhan",
        delayed_unstake: "Unstake Tertunda",
      },
      walletSend: {
        heading_send: "Kirim",
        input_heading_sendTo: "Kirim ke",
        button_useMax: "Gunakan Maks",
        input_heading_selectAsset: "Pilih Aset",
        text_accountIdInfo:
          "ID akun harus menyertakan Akun Tingkat Atas seperti .near atau berisi ,tepat 64 karakter.",
        input_placeHolder_sendTo: "Kirim ke ID akun",
        tooltip_addressBook: "Buku alamat",
        use_max: "Gunakan Maks",
        available: "Tersedia",
        no_account_provide: "Tidak ada akun yang disediakan",
        account_id_note_1: "ID akun harus valid seperti",
        account_id_note_2: "atau berisi tepat 64 karakter.",
        account_id_note_3:
          "ID akun harus berupa alamat NEAR yang valid (misalnya, .near atau alamat implisit) atau alamat EVM yang valid.",
        account_check_errors: {
          invalid_account: "Akun tidak valid",
          invalid_account_format: "Format akun tidak valid",
          invalid_account_length_long: "Panjang akun tidak valid (terlalu panjang)",
          invalid_account_length_short: "Panjang akun tidak valid (terlalu pendek)",
        },
        error_empty_amount: "Silakan isi kolom jumlah",
        warning_address_non_standard:
          "Alamat yang Anda kirim bukan akhiran {network} non standar ({accountSuffix})",
        sending_bridged_token_alert:
          "Ini adalah token berjejambat. Jangan menghantarnya ke bursa seperti Binance.",
        account_no_exists_warning: "Akun belum ada",
        named_account_no_exists_warning:
          "Mengirim ke akun bernama yang belum ada kemungkinan besar akan gagal",
        account_no_exists_warning_deposit:
          "Akun belum ada- akan dibuat secara otomatis pada deposit ini",
        sending: "Mengirim",
        to: "ke",
        account_exists: "Akun ada",
        send: "Terkirim",
        confirm_send: "Konfirmasi Kirim",
        finish: "Menyelesaikan",
        txID: "ID transaksi",
        sendFtSuccess: "Kirim FT berhasil",
        sendSuccess: "Kirim berhasil",
        mode_not_support: "mode tidak didukung",
        receiver_balance: "Akun saat ini memiliki saldo {balance} {symbol}",
        receiver_balance_fail: "Tidak dapat memperoleh saldo",
        input_error_ft: "{label} tidak dapat dipindahtangankan",
      },
      importWallet: {
        heading_confirmAccount: "Impor Akun Anda",
        blurb_confirmAccount: "Pilih dompet yang ingin Anda impor",
        heading_inputPhraseSection: "Frase Rahasia",
        blurb_inputPhraseSection: "Berikan frasa pemulihan rahasia dompet untuk mengimpor dompet",
        heading_chooseInputType: "Bagaimana Anda ingin mengimpor dompet Anda?",
        heading_passwordSection: "Impor Dompet",
        heading_inputPrivateKeySection: "Kunci Pribadi",
        blurb_inputPrivateKeySection: "Berikan kunci pribadi dompet untuk mengimpor dompet",
        blurb_passwordSection: "Kata sandi dompet diperlukan untuk mengimpor dompet",
        toast_title_noAccountFound: "Tidak Ada Akun Ditemukan",
        toast_text_noAccountFound:
          "Tidak dapat menemukan akun apa pun yang ditautkan ke frase pemulihan rahasia itu",
        toast_title_unknownError: "Pencarian Gagal",
        toast_text_unknownError:
          "Terjadi kesalahan API saat mencoba memeriksa akun. Periksa kembali frasa tersebut dan coba lagi.",
        toast_text_invalidKey: "Kunci tidak sesuai. Silakan periksa masukan Anda dan coba lagi.",
        a_12_word_secret: "Frasa rahasia 12 kata",
        secret_phrase: "Frase Rahasia",
        private_key: "Kunci Pribadi",
        private_key_desc: "Kunci pribadi akun",
        hardware: "Ledger",
        hardware_desc: "Dompet perangkat keras",
        words_12: "12 kata",
        private_crypto_key: "Kunci kripto pribadi",
        find_my_account: "Temukan akun saya",
        account: "Akun",
        already_imported: "Sudah diimpor",
        text_approve_ledger: "Setujui pada Perangkat",
        dont_see_wallet: "Tidak dapat menemukan akun Anda?",
        manual_import_here: "Impor secara manual.",
      },
      manualImport: {
        manual_import_account: "Impor Akun Secara Manual",
        import: "Impor Akun",
        insert_your_account_id: "Masukkan id akun Anda di sini untuk mengimpor akun Anda",
        incorrect_account_id:
          "Format id akun tidak valid, harus merupakan bagian dari akun root seperti .near, .tg, atau .sweat",
        account_not_exist_or_not_match: "Akun tidak ada atau kunci akses tidak cocok",
        account_info_network_error:
          "Terjadi kesalahan saat mendapatkan informasi akun. Silakan coba lagi nanti",
        account_found_and_import: "Akun ditemukan, Anda sekarang dapat mengimpor akun tersebut",
        close: "Tutup",
      },
      importWalletHardware: {
        title: "Dompet Perangkat Keras",
        subtitle: "Tentukan jalur HD untuk mengimpor akun tertautnya.",
        toast_title_noAccountFound: "Akun Tidak Ditemukan",
        toast_text_noAccountFound:
          "Tidak dapat menemukan akun apa pun yang tertaut ke jalur HD itu",
      },
      createWalletHardware: {
        title: "Dompet Perangkat Keras",
        subtitle: "Tentukan jalur HD untuk membuat dompet",
        button_confirm: "Buat Dompet Baru",
        toast_title_noAccountFound: "Akun ada",
        toast_text_noAccountFound: "Akun sudah ada pada jalur HD itu",
      },
      signTx: {
        receiving_from_dapp: "Menerima detail dari Dapp",
        couldnt_parse_arg_login: "Tidak dapat mengurai argumen yang benar untuk login",
        couldnt_parse_arg_logout: "Tidak dapat mengurai argumen yang benar untuk logout",
        connect_request: "Hubungkan Permintaan",
        connect_with_acc: "Terhubung Dengan Akun",
        this_app_would_like_to: "Aplikasi ini ingin",
        know_your_add: "Ketahui alamat dompet Anda",
        know_your_balance: "Ketahui saldo akun Anda",
        network_fee_placeholder:
          "Aplikasi akan diberikan izin untuk membelanjakan hingga 0,25 DEKAT terhadap biaya jaringan (gas) yang dikeluarkan selama penggunaan.",
        network_fee_allowance: "Tunjangan Biaya Jaringan",
        something_went_wrong: "Ada yang salah",
        create_import_wallet: "Buat atau Impor Dompet Baru",
        contract: "Kontrak",
        connect: "Menghubung",
        cancel: "Membatalkan",
        request_logout_could_not_found: "Akun yang diminta untuk keluar tidak dapat ditemukan",
        sign_out_request: "Permintaan Keluar",
        sign_out_desc: "Anda telah meminta untuk keluar dari kontrak",
        logout: "Keluar",
        couldnt_parse_arg_verify: "Tidak dapat mengurai argumen yang benar untuk autentikasi",
        request_authentication_not_found:
          "Akun yang diminta untuk autentikasi tidak dapat ditemukan",
        verification_request: "Permintaan Verifikasi",
        verification_request_desc: "Hanya verifikasi identitas Anda di situs yang Anda percayai",
        verify_account: "Verifikasi dengan akun",
        select_account: "Pilih akun",
        know_your_chosen_wallet_add: "Diketahui alamat dompet pilihan Anda",
        verify_own_wallet_add: "Verifikasikan bahwa Anda pemilik alamat dompet ini",
        does_not_allow: "Ini tidak memungkinkan",
        calling_method_on_behalf: "Memanggil metode atau menandatangani transaksi atas nama Anda",
        verify: "Memeriksa",
        estimated_changes: "Estimasi Perubahan",
        send: "Kirim",
        you_sending_asset: "Anda mengirimkan aset ini",
        you_sending_assets: "Anda mengirimkan aset ini",
        couldnt_parse_arg_tx:
          "Tidak dapat mengurai argumen yang benar untuk menandatangani transaksi",
        approve_transactions: "Menyetujui Transaksi",
        approve_transaction: "Menyetujui Transaksi",
        transaction: "Transaksi",
        approve: "Menyetujui",
        close_details: "Tutup Detail",
        view_transaction_details: "Lihat Detail Transaksi",
        transaction_details: "Detil transaksi",
        fees_tooltips: 'Juga dikenal sebagai "gas" - biaya pemrosesan jaringan untuk transaksi ini',
        fees_assurance:
          "Biaya aktual seringkali 90-95% lebih rendah dari perkiraan dan jumlah yang tersisa akan dikembalikan",
        fees: "Biaya",
        with_deposit: "Dengan Setoran",
        from: "dari",
        to: "ke",
      },
      explore: {
        text_explore: "Mengeksplorasi",
        text_challenges: "Tantangan",
        text_missions: "Misi",
        text_rewards: "Hadiah",
        trending_projects: "Proyek Tren",
        defi: "DeFi",
        nfts: "NFT",
        near_ecosystem: "Dekat Ekosistem",
        hide: "bersembunyi",
        show: "menunjukkan",
        tonic_desc: "Platform perdagangan berkinerja tinggi dan terdesentralisasi penuh di DEKAT.",
        antisocial_desc:
          "$GEAR kami sendiri adalah alat pembayaran yang sah untuk undian oleh Antisocial Labs. Langkah 1: Tukar $GEAR melalui Meteor atau dapatkan dengan Tinkers. Langkah 2: Menangkan NFT",
        spin_desc: "Buku pesanan on-chain pertama DEX di DEKAT dengan pengalaman seperti CEX.",
        burrow_desc: "Pasokan dan pinjam aset berbunga di NEAR Protocol.",
        perk_desc: "Agregator likuiditas untuk DEKAT dengan rangkaian lengkap token",
        pembrock_desc: "Platform pertanian hasil leverage pertama di DEKAT.",
        meta_yield_desc:
          "Platform penggalangan dana yang memungkinkan setiap pemegang $NEAR untuk mendukung proyek.",
        paras_desc: "Pasar sosial all-in-one untuk pencipta dan kolektor",
        tradeport_desc: "Platform perdagangan lintas rantai menggabungkan NFT dari pasar",
        near_social_desc: "Protokol data sosial untuk DEKAT",
        near_crash_desc: "Coba dan uangkan sebelum crash!",
        challenge: {
          btn_view_details: "Lihat Detail",
          btn_view_winners: "Lihat Pemenang",
          btn_accept_challenge: "Terima Tantangan",
          btn_challenge_accepted: "Tantangan diterima",
          status: {
            [EChallengeStatus.COMING_SOON]: "Segera hadir",
            [EChallengeStatus.ACTIVE]: "Aktif",
            [EChallengeStatus.ENDED_WITHOUT_WINNERS]: "Berakhir",
            [EChallengeStatus.ENDED_WITH_WINNERS]: "Berakhir",
            [EChallengeStatus.WINNERS_TO_BE_ANNOUNCED]: "Pemenang Akan Diumumkan",
          },
        },
        mission: {
          label_my_profile: "Profil Saya",
          label_level: "Tingkat",
          label_points_earned: "Poin yang Diperoleh",
          label_global_ranking: "Peringkat Global",
          text_mission_unlock: "misi selesai untuk membuka kunci level berikutnya",
          label_daily_tasks: "Tugas Harian",
          label_daily_task: "Tugas Harian",
          label_points_reward: "poin sebagai imbalan",
          label_earn_more_side_quest: "Misi sampingan",
          label_completed: "Selesai",
          label_earned: "diperoleh",
          button_start_now: "Mulai Sekarang",
          user_consent: {
            label_title: "Jelajahi Misi Meteor!",
            label_description:
              "Ambil tantangan yang mendebarkan, kumpulkan poin, dan tukarkan mereka dengan hadiah yang luar biasa.",
            button_accept: "Ya, mari kita hadapi misi-misi ini!",
            text_note:
              "Terima kasih telah bergabung dengan Meteor Missions! Tunggu sebentar sambil kami menyiapkan segalanya untuk Anda (+-15 detik).",
          },
          no_daily_task:
            "Semua siap untuk hari ini! Kembali besok untuk melanjutkan rangkaian harian Anda.",
          no_side_quest:
            "Anda telah menyelesaikan semua pencarian! Tetap terhubung untuk tantangan baru yang akan datang segera.",
        },
        reward: {
          label_collected_points: "Poin yang Dikumpulkan",
          label_redeem: "Tukarkan",
          label_redeem_history: "Riwayat Penukaran",
          label_claim_reward: "Klaim Hadiah",
          label_left: "tersisa",
          button_redeem: "Tukarkan",
          button_harvest: "Panen",
          button_claim: "Klaim",
          no_redeem_title: "Tidak Ada Hadiah Tersedia",
          no_redeem_description: "Tidak ada penawaran yang siap untuk ditukarkan saat ini.",
          no_claim_reward_title: "Tidak Ada Hadiah Tersedia",
          no_claim_reward_description:
            "Anda tidak memiliki hadiah yang bisa ditukarkan. Terus berpartisipasi dalam misi untuk mendapatkan poin dan menukarkannya dengan hadiah!",
        },
      },
      meteorCard: {
        home: {
          subtitle:
            "Bergabunglah dengan komunitas Meteor dengan mendaftar lebih awal untuk DeFi Mastercard eksklusif kami. Jadilah yang pertama menikmati pembelanjaan kripto yang lancar dengan kartu kami yang akan datang.",
          early_access_end: "Penawaran Keuntungan Akses Awal berakhir dalam",
          view_perks: "Lihat Keuntungan",
          apply_now: "Daftar Sekarang",
        },
        perkModal: {
          title1: "Akses Awal",
          title2: "Keuntungan",
          item_title1: "Deposit yang Dapat Dikembalikan Sepenuhnya",
          item_subtitle1:
            "Pesan tempat Anda sekarang hanya dengan $5 USDC—dapat dikembalikan sepenuhnya, tanpa risiko!",
          item_title2: "Biaya Promosi",
          item_subtitle2:
            "Penawaran Akses Awal: Dapatkan tempat Anda hanya dengan $5 USDC! (Bernilai $19,99)",
          item_title3: "Hadiah Eksklusif",
          item_subtitle3:
            "Dapatkan Kontrak Ahli di Harvest Moon dan tingkatkan kemajuan Anda untuk memenuhi syarat mendapatkan airdrop Meteor.",
        },
        signup: {
          title: "Daftar Sekarang",
          subtitle: "Lengkapi formulir di bawah ini untuk mendapatkan akses awal:",
          email: "Alamat Email",
          country: "Negara",
          country_placeholder: "Pilih Negara",
          estimate_usage:
            "Seberapa sering Anda akan menggunakan Meteor Mastercard Anda setiap bulan?",
          early_access_perks: "Keuntungan Akses Awal",
          button_proceed: "Lanjutkan dengan Pembayaran",
          end_in: "Akhiri",
          error_registered: "Anda sudah terdaftar",
          error_signup_status_not_ready:
            "Permintaan pendaftaran saat ini belum siap (status: {status}). Silakan coba lagi nanti",
        },
        myApplication: {
          application_applied: "Aplikasi Diterapkan",
          title: "Aplikasi Saya",
          subtitle: "Kami akan segera menghubungi Anda dengan detail peluncuran.",
          wallet_id: "ID Dompet",
          email: "Alamat Email",
          country: "negara",
          country_placeholder: "Pilih Negara",
          cancel: "Batalkan Aplikasi",
          update: "Perbarui",
          error_cancel_status_not_ready:
            "Permintaan pembatalan saat ini belum siap (status: {status}). Silakan coba lagi dalam beberapa menit",
        },
        sufficient_balance: {
          title: "Saldo Tidak Cukup",
          subtitle:
            "Deposit Kartu $5 dalam USDC diperlukan untuk mengaktifkan aplikasi akses awal Anda. Jika Anda memutuskan untuk tidak mengambil kartu tersebut, Anda dapat membatalkannya dalam waktu 7 hari dan mendapatkan kembali deposit Anda.",
          back: "Kembali ke Dompet",
          topup: "Topup USDC",
        },

        estimateUsageOption: {
          [EMeteorCardEstimateUsage.below_250]: "Penggunaan ringan (hingga $250)",
          [EMeteorCardEstimateUsage.from_250_to_1000]: "Penggunaan sedang (hingga $1000)",
          [EMeteorCardEstimateUsage.above_1000]: "Penggunaan berat ($1000+)",
        },
      },
      appSettings: {
        heading_settings: "Pengaturan aplikasi",
        button_language: "Bahasa",
        button_addressBook: "Buku alamat",
        button_subtext_addressBook: "Alamat yang sering digunakan",
        button_autoLockTimer: "Pewaktu Kunci Otomatis",
        button_subtext_autoLockTimer: "Durasi timer dompet kunci otomatis",
        button_changePassword: "Ganti kata sandi",
        button_subtext_changePassword: "Ubah kata sandi buka kunci Anda",
        button_aboutMeteor: "Tentang Meteor",
        button_subtext_aboutMeteor: "Kontak dan info komunitas kami",
        button_meteorCommunity: "Komunitas Meteor",
        button_subtext_meteorCommunity: "Datang dan bergabunglah dengan kami",
        sectionConnectedApp: {
          text_deauthorize: "Batalkan otorisasi",
          text_gasFeeAllowance: "Tunjangan Biaya",
          text_allowedMethod: "Metode yang Diizinkan",
          text_any: "Setiap",
        },
        sectionProfile: {
          update_profile_warning:
            "Pertama kali memperbarui profil akan naik menjadi 0,04 DEKAT sebagai biaya setoran penyimpanan",
          update_pfp_warning:
            "Set pertama kali PFP akan dilampirkan hingga 0,04 DEKAT sebagai biaya setoran penyimpanan.",
          pfp_updated: "PFP Diperbarui.",
          profile_updated: "Profil diperbarui.",
          name: "Nama",
          about: "Tentang",
          update: "Memperbarui",
          set_pfp: "Tetapkan PFP",
          pfp_tooltip: "PFP perlu diatur di halaman NFT",
          sync_near_social: "Gunakan profil ini di ekosistem NEAR dengan Near Social.",
          sync_near_social_header: "Sinkronkan ke NEAR Social",
          sync_near_social_desc:
            "Sinkronisasi pertama kali ke NEAR Social akan melampirkan hingga 0,04 NEAR sebagai biaya setoran penyimpanan.",
          sync_now: "Sinkronkan Sekarang",
          account_synced: "Akun Anda disinkronkan ke NEAR Social",
          follower: "Pengikut",
        },
        sectionDeleteAccount: {
          text_warning: "Peringatan",
          text_delete_password:
            "Pastikan Anda sudah mencadangkan metode pemulihan Anda atau Anda mungkin kehilangan akses ke akun Anda",
          text_remove_account: "Hapus dari Dompet Meteor",
          text_action_desc: "Tindakan ini akan menghapus akun berikut dari dompet Anda:",
        },
        sectionChangePassword: {
          text_password_changed_success: "Kata sandi berhasil diubah",
          text_change_password_warning:
            "Ini akan mengubah kata sandi masuk Anda untuk seluruh dompet (semua akun)",
          text_finish: "Menyelesaikan",
          text_change_password: "Ganti kata sandi",
          text_create_password: "Buat Kata Sandi baru",
        },
        sectionCommunity: {
          text_thank_you: "Terima Kasih Telah Memilih Dompet Meteor!",
          text_follow_twitter: "Ikuti Twitter",
          text_report_bug: "Bergabunglah dengan Perselisihan",
          text_join_discord: "Bergabunglah dengan Perselisihan",
          text_communityBlurb:
            "Kami ingin Anda menjadi anggota komunitas kami yang terus berkembang- dan mendengar pendapat Anda tentang apa yang dapat kami lakukan untuk meningkatkan.",
        },
        sectionAccessKey: {
          text_add_key: "Tambahkan Kunci Akses Baru",
          text_edit_label: "Sunting Label",
          text_revoke_access: "Mencabut akses",
          text_revoke_access_key: "Cabut Kunci Akses",
          text_remove_key: "Hapus Kunci",
          text_remove_key_desc: "Yakin ingin menghapus kunci akses ini dari Akun Near Anda?",
          text_cancel: "Membatalkan",
          text_primary_key: "Kunci Utama Meteor",
          text_hardware_key: "Kunci Perangkat Keras",
          text_hardware_ledger_key: "Kunci Ledger",
          text_hd_path: "Jalur HD",
          text_public_key: "Kunci Publik",
          text_known_data: "Data yang diketahui",
          text_private_key: "Kunci Pribadi",
          text_secret_phrase: "Frase Rahasia",
          text_unknown_to_meteor: "Tidak diketahui Meteor",
          text_access_key_warning_msg:
            "Pastikan kunci akses ini tidak ditautkan ke metode pemulihan apa pun yang masih ingin Anda gunakan! Mereka tidak akan bekerja lagi.",
          text_access_key: "Kunci akses",
          text_add_key_subtitle: "Hasilkan atau tambahkan kunci akses untuk dompet ini",
          text_access_key_label: "Akses Label Kunci",
          text_generate_new_key: "Hasilkan Kunci Baru",
          text_generate_new_key_desc: "Hasilkan kunci pemulihan frase benih baru untuk dompet ini",
          text_clear_label: "Hapus Label",
        },
      },
      wallet: {
        max: "Maks",
        heading_walletLocked: "Dompet Terkunci",
        button_unlockWallet: "Buka Kunci Dompet",
        blurb_walletLocked:
          "Dompet ini saat ini terkunci. Berikan kata sandi Anda untuk membukanya.",
        toast_heading_passwordIncorrect: "Kata sandi salah",
        toast_text_passwordIncorrect: "Gagal masuk ke profil Anda",
        settings: {
          settings: "Pengaturan",
          heading_settings: "Pengaturan dompet",
          input_heading_extractSecret: "Lihat Frase Rahasia",
          input_text_extractSecret: "Ekstrak frasa rahasia dompet Anda",
          input_heading_exportPrivateKey: "Ekspor Kunci Pribadi",
          input_heading_managePrivateKeys: "Kelola Kunci Akses Penuh",
          input_text_managePrivateKeys: "Lihat, beri label, dan putar kunci pribadi Anda",
          input_text_exportPrivateKey: "Ekspor kunci pribadi dompet Anda",
          input_heading_walletLabel: "Label Dompet",
          input_text_walletLabel: "Masukkan label untuk dompet ini",
          menu_heading_profile: "Profil",
          menu_text_profile: "Kelola profil Anda",
          menu_heading_connectedApps: "Aplikasi yang terhubung",
          menu_text_connectedApps: "Kelola akses aplikasi ke dompet Anda",
          menu_heading_securityAndRecovery: "Keamanan dan Pemulihan",
          menu_text_securityAndRecovery: "Kelola frasa rahasia dan kunci pribadi dompet Anda",
          menu_heading_changePassword: "Ganti kata sandi",
          menu_text_changePassword:
            "Ubah kata sandi yang digunakan untuk membuka kunci dompet Anda",
          menu_heading_RemoveWalletAccount: "Menghapus akun",
          menu_text_removeWalletAccount: "Hapus akun ini dari dompet Anda",
          common: {
            account_not_created_secret_note_1:
              "Akun ini tidak dibuat atau diimpor (menggunakan Frasa Rahasia) melalui Meteor Wallet, jadi saat ini tidak ada frasa rahasia terenkripsi yang tersedia",
            account_not_created_secret_note_2:
              "Yakinlah, frase rahasia asli Anda akan tetap berfungsi sebagai metode pemulihan jika Anda belum menghapusnya dari akun Near Anda",
            account_not_created_secret_note_3:
              "Fungsi untuk memutar frasa rahasia Anda di Meteor Wallet sedang dikerjakan!",
            enterPasswordBlurb: "Kata sandi dompet diperlukan",
            enterPasswordCreateWalletBlurb:
              "Kata sandi dompet diperlukan untuk menambahkan dompet baru",
          },
          exportPrivateKey: {
            text_subheadingWarning:
              "Berhati-hatilah di mana Anda menyimpan atau membagikan kunci ini. Siapa pun yang memiliki akses ke sana dapat mengambil alih akun dompet ini.",
            text_copiedToClipboard: "Kunci pribadi disalin",
          },
          manageAccessKeys: {
            input_text_accessKeyLabel: "Masukkan label untuk Kunci Akses ini",
            button_updateLabel: "Perbarui Label",
          },
        },
      },
      signIn: {
        welcome: "Selamat datang ",
        blurb: "Web terdesentralisasi menanti Anda...",
        button_unlock: "Membuka kunci",
        input_header_password: "Buka kunci dengan kata sandi",
        text_forgot_password: "Tidak ingat kata sandi?",
        toast_heading_passwordIncorrect: "Kata sandi salah",
        toast_text_passwordIncorrect: "Tidak dapat masuk ke profil Anda",
      },
      addWallet: {
        blurb: "Pilih bagaimana Anda ingin mengatur dompet Anda",
        heading_meteorWallet: "Dompet Meteor",
        button_import_wallet: "Impor Dompet",
        button_subtext_import_wallet: "Impor dompet Anda yang ada menggunakan frase benih 12 kata",
        button_create_new_wallet: "Buat Dompet Baru",
        button_subtext_create_new_wallet: "Ini akan membuat dompet baru dan seed frase",
        text_named_wallet: "Dompet bernama",
        text_named_wallet_desc: "Nama khusus yang Anda pilih",
        text_unavailable: "TIDAK TERSEDIA",
      },
      createNewWallet: {
        heading_newWallet: "Dompet Baru",
        please_insert_password: "Kata sandi dompet diperlukan untuk menambahkan dompet baru",
        p4_please_try_again: "Silakan coba lagi",
        p4_unforunately_something_went_wrong:
          "Maaf, terjadi kesalahan dan kami tidak dapat mendanai pembuatan dompet Anda. Anda dapat membuat dompet implisit dan mendanai pembuatan dompet saat ini.",
        heading_newWalletChoice: "Pilihan ada padamu",
        subheading_newWalletChoice: "Dompet seperti apa yang ingin Anda buat?",
        requires_initial_balance:
          "Membutuhkan saldo awal 0,1 DEKAT untuk membuka, didanai dari dompet yang terhubung sebelumnya",
        random_64_character: "Pengidentifikasi 64 karakter acak",
        next: "Lanjut",
        traditional_crypto_wallet: "Dompet Kripto Tradisional",
        new_wallet: "Dompet Baru",
        available_near: "Tersedia DEKAT",
        available_fund: "Tersedia untuk pendanaan",
        initial_wallet_balance: "Saldo Dompet Awal",
        initial_wallet_balance_named_wallet:
          "Setidaknya 0,1 DEKAT diperlukan sebagai saldo awal saat membuat dompet bernama kustom",
        select_funding_wallet: "Pilih Dompet Pendanaan",
        no_account_selected: "Tidak Ada Akun yang Dipilih",
        account_not_exist: "akun tidak ada",
        not_enough_funds: "Dana di rekening tidak cukup",
        initial_funding_amount: "Jumlah Pendanaan Awal",
        account_identity: "Identitas Akun Anda",
        account_identity_desc: "Apa yang Anda inginkan dari alamat Near wallet kustom Anda?",
        is_available: "tersedia",
        username_is_available: "Selamat. Nama pengguna Anda valid",
        account_already_exists: "Nama akun sudah ada",
        account_not_compatible: "Nama akun tidak kompatibel",
        account_can_contain: "ID akun Anda dapat berisi salah satu dari berikut ini",
        lowercase_characters: "Karakter huruf kecil",
        digits: "Digit",
        character_requirement: "Karakter (_-) dapat digunakan sebagai pemisah",
        account_cannot_contain: "ID akun Anda TIDAK BISA berisi",
        character_dot: 'Karakter "@" atau "."',
        more_than_64_characters: "Lebih dari 64 karakter (termasuk .",
        fewer_than_2_characters: "Kurang dari 2 karakter",
        explore_web3: "Jelajahi Web3",
        step_into_future: "Melangkah ke Masa Depan dengan Meteor",
        generateNew: "Hasilkan Baru",
        claimIdentity: "Klaim identitas Anda",
        button_create_with_ledger: "Buat dengan Ledger",
        extensionCreate: {
          title: "Pembuatan Dompet Dinonaktifkan",
          description:
            "Pembuatan akun sementara dinonaktifkan pada ekstensi. Silakan buat dompet Anda di dompet web, lalu impor ke dalam ekstensi.",
          button_import: "Impor dompet yang sudah ada",
          button_open_web_wallet: "Buka Dompet di Web",
        },
      },
      gettingStarted: {
        button_getStarted: "Memulai",
        welcomeToMeteor: "Selamat datang di Meteor",
        blurb:
          "Simpan dan pertaruhkan token NEAR Anda dengan aman dan aset yang kompatibel dengan Meteor.",
      },
      createPassword: {
        buttons: {
          continue: "melanjutkan",
        },
        agreeToTerms: (link) => (
          <>
            saya setuju{" "}
            <Link colorScheme={"brandPrimary"} fontWeight={600} href={link} isExternal>
              Ketentuan Layanan
            </Link>
          </>
        ),
        heading: "Buat kata sandi",
        blurb: "Anda akan menggunakan ini untuk membuka kunci dompet Anda",
        placeholders: {
          enterPassword: "Masukkan kata kunci",
          confirmPassword: "konfirmasi sandi",
        },
        validation: {
          atLeast8: "Setidaknya 8 karakter",
          doNotMatch: "Sandi tidak cocok",
          strengthTooWeak: "Terlalu lemah",
          strengthWeak: "Lemah",
          strengthMedium: "Sedang",
          strengthStrong: "Kuat",
        },
      },
      recoveryPhrase: {
        heading: "Mnemonik rahasia",
        blurb:
          "Simpan 12 kata ini ke pengelola kata sandi, atau tulis dan simpan di tempat yang aman. Jangan berbagi dengan siapa pun.",
        confirmSavedPhrase: "Saya menyimpan Frasa Pemulihan Rahasia saya",
        buttons: {
          continue: "Melanjutkan",
          copy: "Salinan",
          generateNew: "Hasilkan Baru",
        },
        toasts: {
          copiedToClipboard: "Disalin ke papan klip",
        },
      },
      seedPhraseConfirmation: {
        buttons: {
          confirm: "Konfirmasi",
        },
        wordForFirst: "Pertama",
        wordForLast: "Terakhir",
        heading: "Sudahkah Anda menyimpannya?",
        blurb:
          "Pastikan Anda menyimpan mnemonik Anda dengan mengeklik kata pertama (1) dan terakhir (12).",
        confirmationWrongHeading: "Kata-kata Frase Pemulihan Salah",
        confirmationWrongBlurb:
          "Pastikan Anda telah menyimpan frasa ini di tempat yang aman, dan dapat mengingatnya jika diperlukan",
        profilePasswordMismatchHeading: "Kata sandi salah",
        profilePasswordMismatchBlurb:
          "Kata sandi profil saat ini tidak cocok dengan yang diberikan",
      },
      accountSuccess: {
        heading: "Menyelesaikan!",
        blurb: "Perhatikan pembaruan produk, jika Anda memiliki pertanyaan, silakan hubungi kami",
        followUsOnTwitter: "Ikuti kami di Twitter",
        joinDiscord: "Dapatkan bantuan tentang Discord",
        button_finish: "Menyelesaikan",
        button_redirect: "Kunjungi URL Pengalihan",
        toast_title: "Buat Akun Sukses",
        toast_title_with_redirect:
          "Akun berhasil dibuat, Anda akan segera dialihkan kembali ke aplikasi.",
        toast_redirect_whitelisted_failed: "Tautan pengalihan ini belum disetujui untuk pengalihan",
      },
      transactions: {
        heading_history: "Sejarah",
        badgeStatus: {
          [ETransactionBadgeStatus.SUCCEED]: "Kesuksesan",
          [ETransactionBadgeStatus.FAILED]: "Gagal",
          [ETransactionBadgeStatus.LOADING]: "Memuat",
          [ETransactionBadgeStatus.PROCESSING]: "Pengolahan",
          [ETransactionBadgeStatus.WAITING]: "Menunggu",
          [ETransactionBadgeStatus.UNKNOWN]: "Tidak dikenal",
        },
        common: {
          call: "CALL",
          status: {
            success: "KESUKSESAN",
            failed: "GAGAL",
            unknown: "Tidak dikenal",
          },
        },
        loadingBottom: {
          more: "Muat lebih banyak",
          loading: "Memuat",
          end: "Tidak ada disini",
          endTransaction90Days: "Tidak Ada Transaksi Lagi dalam 90 hari terakhir",
        },
        typeName: {
          receive: "Diterima",
          self: "Dipanggil Sendiri",
          with: "Dengan",
          unknown: "Yang lain",
        },
        direction: {
          from: "Dari",
          to: "ke",
          with: "dan",
        },

        accessKey: {
          addKey: "Sebuah {key} ditambahkan.",
          deleteKey: "Sebuah {kunci} dihapus.",
          key: "Kunci",
          permissionTypes: {
            [ENearIndexer_AccessKeyPermission.FULL_ACCESS]: "kunci akses penuh",
            [ENearIndexer_AccessKeyPermission.FUNCTION_CALL]: "tombol panggil fungsi",
          },
          publicKey: "Kunci Publik",
          receiverId: "Kontrak Resmi",
          allowMethodNames: "Metode yang Diizinkan",
          emptyMethodNames: "Metode Apa Pun",
          allowance: "Jumlah Tunjangan",
        },

        account: {
          createTitle: "Buat Akun",
          createdMessage: "Membuat akun {account_id}.",
          deletedMessage: "Akun {account_id} dihapus.",
          publicKey: "Kunci Publik",
          byId: "Berdasarkan Akun",
          deposit: "Menyetorkan",
          beneficiaryId: "Transfer Saldo Ke",
        },

        deploy: {
          code: "kode",
          message: "Anda telah menerapkan {code} ke {contract}.",
        },

        functionCall: {
          brief: "Memanggil {method_name} di {receiver}",
          details: "Memanggil metode {method_name} pada kontrak {receiver}.",
          cost: "Batas gas:",
          deposit: "Menyetorkan:",
          args: "Args:",
        },

        details: {
          transactionHash: "Transaksi Hash",
          includedInBlockHash: "Blokir Hash",
          includedInChunkHash: "Potongan Hash",
          blockTimestamp: "Tanda Waktu",
          signerAccountId: "Penandatangan",
          signerPublicKey: "Kunci Publik",
          receiverAccountId: "Penerima",
          convertedIntoReceiptId: "Resi",
          receiptConversionBurnt: "Gas",
          moreInformation: "Informasi Lebih Lanjut",
          lessInformation: "Kurang Informasi",
          action: "Tindakan",
          viewExplorer: "Lihat Di Penjelajah",
        },

        custom: {
          ftSwap: {
            title: "Pertukaran FT",
            near: "Dekat Swap",
          },
          nftTrade: {
            direction: {
              [ENftOfferDir.TO_YOU]: "Memberimu",
              [ENftOfferDir.FROM_YOU]: "Darimu",
            },
          },
        },
      },
      nftCollection: {
        heading_nft: "Koleksi Saya",
        nothing: "Anda belum memiliki NFT.",
        total_nfts: "Total NFT",
        total_floor_price: "Total Harga Dasar",
        total_floor: "Jumlah Lantai",
        floor_price: "Harga Lantai",
        contract: "Kontrak",
      },
      nftDetails: {
        button_send: "Kirim",
        button_explorer: "Penjelajah",
        button_view: "Melihat",
        heading_description: "Keterangan",
        heading_properties: "Properti",
      },
      execution: {
        step: "Langkah",
        of: "dari",
        transaction_hash: "Hash Transaksi",
        button_finish: "Selesai",
        title: "Menjalankan Transaksi",
        checking: "Memeriksa",
        transaction_execution_status: {
          [ETransactionExecutionStatus.awaiting_signer]: "Menunggu Penandatangan",
          [ETransactionExecutionStatus.failed]: "Gagal",
          [ETransactionExecutionStatus.pending_signing]: "Menunggu Penandatanganan",
          [ETransactionExecutionStatus.publishing]: "Menerbitkan",
          [ETransactionExecutionStatus.signed]: "Ditandatangani",
          [ETransactionExecutionStatus.success]: "Berhasil",
        },
      },
      ledger: {
        title: "Perangkat Ledger",
        connected: "Terhubung",
        button_try_again: "Coba Lagi",
        ledger_device_alert: {
          [ELedgerConnectionStatus.connected]: {},
          [ELedgerConnectionStatus.disconnected]: {},
        },
        functionality_not_supported: "Fungsi ini belum didukung pada perangkat Ledger.",
      },
    },
  } as DeepPartial<ITranslations>,
  translation_en,
);
