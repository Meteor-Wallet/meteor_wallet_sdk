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

export const translation_fr: ITranslations = _.defaultsDeep(
  {
    languageDisplayName: "France",
    languageCode: "fr",
    bridge: {
      button_view_transaction: "Voir la Transaction",
      intent_pending: {
        title: "Transfert de Pont en Cours",
        description:
          "Vous avez une transaction de pont en cours. Voulez-vous continuer ou en créer une nouvelle?",
        button_create_new_bridge: "Créer un Nouveau Pont",
      },
      warning_no_more_transactions: "Aucune transaction supplémentaire",
      warning_old_bridge:
        "Le pont est en cours de transition vers l'utilisation des Intents NEAR. Cliquez ici pour voir vos anciennes transactions de pont.",
      transitioning_to_intents:
        "Le pont passe à l'utilisation de Near Intents. Cliquez ici pour découvrir le pont Near Intents.",
      warning_insufficient_balance: "Solde insuffisant",
      modal_add_public_key: {
        title: "Prêt à utiliser les Intents NEAR?",
        description:
          "Ajoutez une clé publique unique pour activer les Intents NEAR et commencer votre transaction.",
      },
      modal_terminate_bridge: {
        title: "Annuler le Pont",
        description:
          "Êtes-vous sûr de vouloir terminer le processus de pont actuel? Vous pouvez en créer un nouveau à tout moment.",
      },
      modal_available_balance: {
        title: "Procéder avec le solde disponible",
        description:
          "Vous avez un solde disponible dans le pont, qui sera utilisé pour traiter cette transaction.",
      },
      modal_similar_pair: {
        title: "Transfert de pont en cours",
        description:
          "Vous avez une transaction de pont en cours. Voulez-vous en créer une nouvelle?",
        button_create_new: "Créer Nouveau",
        button_back: "Retour",
        footer_note:
          "Créer un nouveau pont annulera la transaction précédente et remboursera tous les fonds déposés.",
      },
      modal_refund: {
        title: "Remboursement",
        label_network: "Réseau",
        label_insert_address: "Insérez l'adresse du portefeuille pour recevoir les remboursements",
        placeholder_insert_address: "Veuillez insérer l'adresse du portefeuille",
        label_insert_address_confirm: "Confirmez l'adresse du portefeuille",
        placeholder_insert_address_confirm: "Veuillez insérer l'adresse du portefeuille à nouveau",
        error_invalid_address: "Adresse invalide",
        error_address_not_match: "Les adresses ne correspondent pas",
      },
      button_cancel: "Annuler",
      button_proceed: "Procéder",
      label_reference_id: "ID de Référence",
      label_status: "Statut",
      label_refund_destination: "Destination du Remboursement",
      label_source_network: "Réseau Source",
      label_destination_network: "Réseau de Destination",
      label_source_token: "Jeton Source",
      label_destination_token: "Jeton de Destination",
      label_amount_from: "Montant de",
      label_amount_to: "Montant à",
      label_refund_hash: "Hash de Remboursement",
      label_withdrawal_hash: "Hash de Retrait",
      label_created_at: "Créé le",
      quote_result: {
        success: {
          title: "Pont Réussi",
          description:
            "Vos actifs ont été transférés avec succès et sont maintenant disponibles sur le réseau de destination.",
        },
        fail: {
          title: "Échec du Pont",
          description:
            "Le transfert de vos actifs n'a pas pu être complété. Veuillez vérifier les détails du réseau et réessayer, ou contacter le support si le problème persiste.",
        },
        cancel: {
          title: "Pont Annulé",
          description: "La transaction de pont a été annulée.",
        },
      },
      button_refund: "Remboursement",
      button_continue: "Continuer",
      button_view: "Voir",
      label_transaction_processing: "Traitement de la Transaction",
      label_footnote_come_back_later:
        "Vous pouvez fermer cette page en toute sécurité et revenir plus tard",
      button_confirm_quote: "Confirmer le Devis",
      warning_large_withdrawal:
        "Les retraits de plus de ~5,000$ peuvent prendre plus de temps à traiter.",
      quote_header: {
        deposit: {
          title: "Étape 1 : Dépôt",
          subtitle:
            "Vous pouvez fermer cette page en toute sécurité après le dépôt, car cela peut prendre du temps à être traité.",
        },
        confirm_quote: {
          title: "Étape 2 : Confirmer le Devis",
          subtitle:
            "Vous pouvez fermer cette page en toute sécurité après le dépôt, car cela peut prendre du temps à être traité.",
        },
        steps: {
          deposit: "Dépôt",
          confirm_quote: "Confirmer le Devis",
          complete: "Compléter",
        },
      },
      label_deposit_amout: "Montant du Dépôt",
      label_deposit_network: "Réseau de Dépôt",
      label_deposit_address: "Adresse de Dépôt",
      warning_deposit_address_title: "Veuillez prendre note des éléments suivants :",
      warning_deposit_address_desc_1: "Veuillez ne pas déposer d'autres actifs numériques sauf",
      warning_deposit_address_desc_2: "sur",
      warning_deposit_address_desc_3: "à l'adresse ci-dessus.",
      title: "Pont",
      label_pay: "Payer",
      label_receive: "Recevoir",
      label_from: "De",
      label_to: "À",
      label_you_send: "Vous envoyez",
      label_you_receive: "Vous recevez (EST.)",
      label_on_network: "Sur le réseau",
      button_review_bridge: "Revoir le pont",
      button_confirm_bridge: "Confirmer le pont",
      label_bridge_details: "Détails du pont",
      label_bridge_compare: "Comparer les taux entre les fournisseurs",
      label_support_fees:
        "Le montant que vous recevrez peut varier en raison des fluctuations du marché. Envoyer la transaction rapidement aidera à s'assurer qu'elle reste proche du taux indiqué.",
      label_fees: "Frais",
      label_slippage: "Glissement",
      label_on: "Sur",
      button_change: "Changer",
      button_add_sender_address: "Ajouter l'adresse de l'expéditeur",
      button_add_receiver_address: "Ajouter l'adresse du destinataire",
      modals: {
        network_token_selector: {
          label_select_network: "Sélectionner le réseau",
          label_select_token: "Sélectionner un jeton",
          hint_search_network: "Rechercher le réseau",
          hint_search_token: "Rechercher le jeton",
        },
        input_chain_address: {
          label_sender_address: "Adresse de l'expéditeur",
          label_receiver_address: "Adresse du destinataire",
          description: "Insérer un mème ici *clin d'œil*",
          button_confirm: "Confirmer",
        },
        tnc: {
          tnc: "Termes et conditions",
          rate_variability: "Variabilité des taux :",
          rate_variability_desc:
            "Le taux indiqué peut fluctuer en fonction du taux de marché en temps réel. Plus la transaction prend du temps à se terminer, plus il est probable que le montant final reçu puisse varier par rapport au devis initial.",
          third_party_responsibility: "Responsabilité des tiers :",
          third_party_responsibility_desc:
            "Le service de pont est facilité par des partenaires tiers. Meteor Wallet aide uniquement à trouver les meilleures routes et n'est pas responsable en cas de perte ou d'échec si un partenaire ne remplit pas ses obligations.",
          disclaimer: "Avertissement :",
          disclaimer_desc:
            "En utilisant le service de pont, vous reconnaissez que Meteor Wallet ne peut garantir la fiabilité ou l'intégrité des partenaires tiers. Tous les problèmes ou litiges liés au pont doivent être résolus avec le partenaire concerné.",
          citizenship: "Restrictions de citoyenneté utilisateur :",
          citizenship_desc:
            "Conformément à nos conditions d'utilisation, les utilisateurs des États-Unis d'Amérique, de l'Inde, de Singapour et des pays sanctionnés par les Nations Unies ne sont pas autorisés à utiliser ce service.",
          confirm_citizenship:
            "Je confirme que je ne suis pas citoyen des États-Unis d'Amérique, de l'Inde, de Singapour ou d'un pays sanctionné par les Nations Unies comme restreint pour l'utilisation de ce service.",
          agree_tnc: "Je comprends et j'accepte les T&C",
          hide_tnc: "Masquer ce message à l'avenir",
          agree: "Accepter",
        },
      },
      label_bridge_history: "Historique du pont",
      label_total_records: "Total {count} enregistrements",
      button_recheck: "Revérifier",
      label_swapped: "Ponté",
      title_slippage: "Paramètre de glissement",
      desc_slippage:
        "Votre transaction échouera si le prix change plus que le glissement. Une valeur trop élevée entraînera une transaction défavorable.",
      button_confirm: "Confirmer",
      hint_bridge_result:
        "Veuillez noter que vous pouvez toujours vérifier votre historique de transactions sur la page de l'historique du pont.",
      label_bridge: "Pont",
      label_success: "Succès",
      label_failed: "Échoué",
      label_cancelled: "Annulé",
      label_pending: "En attente",
      label_refunded: "Remboursé",
      label_transaction_created: "En Attente de Paiement",
      payment_processing: "Traitement du paiement",
      desc_bridge_success:
        "Votre commande de pontage a été créée et payée. Les actifs pontés/échangés sont actuellement en cours de confirmation et vous seront transférés sous peu. Ce processus prend généralement 10 à 20 minutes.",
      desc_bridge_failed:
        "Le transfert de vos actifs n'a pas pu être complété. Veuillez vérifier les détails du réseau et réessayer, ou contacter le support si le problème persiste.",
      desc_bridge_created:
        "Votre commande a été créée. Vous serez redirigé vers la page de paiement pour finaliser le paiement dans les 300 secondes. Si vous n'êtes pas redirigé automatiquement, veuillez cliquer sur le bouton ci-dessous.",
      button_back_to_wallet: "Retour au Portefeuille",
      button_check_transaction_status: "Vérifier le Statut de la Transaction",
      button_redirect_to_payment: "Rediriger vers le Paiement",
      label_seconds: "secondes",
      meteor_derived_status: {
        failed_deposit: "Échoué",
        pending: "En attente",
        processing: "En cours",
        success: "Succès",
        timeout: "Temps écoulé",
        refunded: "Remboursé",
      },
      label_please_add_wallet_address: "Veuillez ajouter l'adresse du portefeuille",
      label_no_route: "Aucune route",
      label_network_not_supported: "{network} n'est pas pris en charge",
      warning_no_network_found:
        "Aucun réseau trouvé. Veuillez essayer un autre mot-clé ou vérifier l'orthographe.",
      warning_no_token_found:
        "Aucun token trouvé. Veuillez essayer un autre mot-clé ou vérifier l'orthographe.",
    },
    error: {
      title_1: "Oups !",
      title_2: "Quelque chose s'est mal passé",
      description:
        "Quelque chose s'est mal passé. Nous y travaillons, et votre rapport nous aidera à résoudre le problème plus rapidement.",
      button_contact_support_now: "Contacter le Support Maintenant",
      button_back_to_wallet: "Retour au Portefeuille",
    },
    rpc_rotate_modal: {
      rotating_rpc: "Le RPC sélectionné est hors service — changez maintenant.",
      selected_rpc_not_working_change_to_other:
        "Le RPC actuellement sélectionné ne fonctionne pas comme prévu. Nous recommandons de le changer pour {rpcName}.",
      change_now: "Changer maintenant",
      all_rpc_down:
        "Le protocole NEAR rencontre des problèmes de réseau, ce qui rend tous les RPC temporairement indisponibles. Les transactions peuvent être retardées et certaines fonctionnalités peuvent ne pas fonctionner.",
    },
    campaign: {
      label_voting_has_ended: "Le vote est terminé",
      what_is_new: {
        "3": {
          description: "Parrainez des amis à Harvest Moon et gagnez votre part de 5 000 $ !",
        },
        "4": {
          description:
            "Nouveau largage de tokens ! Parrainez un ami et gagnez une part de 3 500 $ !",
        },
        "5": {
          description: "Mettez en jeu xRef pendant une semaine et partagez 2500 $ !",
        },
        "6": {
          description:
            "Le pontage entre les réseaux est devenu SIMPLE, RAPIDE, PEU COÛTEUX et SÉCURISÉ. Essayez-le maintenant !",
        },
        "7": {
          description:
            "MISSION FLASH! Votez avec $GEAR dans la Saison des Mèmes 7 pour une part de 50 000 $!",
        },
        "8": {
          description:
            "Les missions de série sont en direct ! Relevez des missions quotidiennes pour des récompenses supplémentaires !",
        },
        "9": {
          description:
            "Prix de 25 000 $ ! Rejoignez la compétition de trading NEAR Memecoin dès aujourd'hui !",
        },
        "10": {
          description:
            "Rejoignez la communauté Meteor et soyez parmi les premiers à profiter de notre carte DeFi Mastercard exclusive",
        },
        "11": {
          description:
            "La Saison des Mèmes 8 est là, votez pour GEAR et réclamez des récompenses excitantes !",
        },
        "13": {
          description:
            "La Saison des Mèmes 9 est là, votez pour GEAR et réclamez des récompenses excitantes !",
        },
        "14": {
          description:
            "La Saison des Mèmes 10 est là, votez pour GEAR et réclamez des récompenses excitantes !",
        },
      },
      meme_phase_2: {
        my_staked_gear: "Mon GEAR Staké",
        estimated_apy: "APY Estimé",
        ref_meme_contest_phase_2: "Concours de Mèmes Ref Phase 2",
        gear_top_5_voted_meme_token_stake_to_earn_rewards:
          "GEAR est maintenant un des 5 meilleurs tokens de mème votés. Stakez GEAR pour gagner des récompenses.",
        meme_season_phase_2_stake_gear_to_earn: "Stakez $GEAR et gagnez jusqu'à 40% APY",
        staking_apy: "APY de Staking",
        stake_at_least_100_gear_for_advanced_contract:
          "Stakez au moins 100 GEAR pour obtenir un contrat avancé. Une période de déverrouillage de 5 jours s'applique.",
        step_1: {
          title: "Étape 1 : Acheter du GEAR",
          description:
            "Pour commencer, achetez du GEAR si vous n'en avez pas déjà assez pour le staking.",
          input_title: "Montant à Acheter",
          input_button: "Acheter",
        },
        step_2: {
          title: "Étape 2 : Stakez du GEAR pour des Récompenses",
          description:
            "Stakez au moins 100 GEAR pour obtenir un contrat avancé. Une période de déverrouillage de 5 jours s'applique.",
          input_title: "Montant à Staker",
          input_button: "Staker",
          warning_success: "Staking de GEAR Réussi",
        },
      },
      claim_successfully: "Réclamé avec succès",
      claim_reward_successfully: "Vous avez réclamé votre récompense avec succès",
      raffle_rewards: "Récompenses de Tombola",
      unstake_open_date_time_6th_sept: "Le déstaking sera ouvert le 6 septembre à 12h UTC.",
      unstake_open_date_time_7th_sept: "Le déstaking sera ouvert le 7 septembre à 12h UTC.",
      reward_open_date_time: "Les récompenses seront distribuées le 6 septembre",
      raffle_result_announcement_date_time:
        "Les résultats de la tombola seront annoncés le 7 septembre à 12h UTC.",
      stake_and_vote: "Stakez & Votez",
      unstake: "Déstaker",
      my_rewards: "Mes Récompenses",
      raffle_ticket: "Ticket de Tombola",
      label_campaign_details: "Détails de la Campagne",
      rewards: {
        title: "Récompense de Participation",
        my_raffle_tickets: "Mes Tickets de Tombola",
        potential_rewards: "Récompenses Potentielles",
        raffle_ticket_for_each_xref_voted: "Ticket de Tombola pour chaque xRef Voté",
        label_for_participating: "pour participer",
        label_for_each_vote: "pour chaque xREF voté",
        reward_gear: "jusqu'à 2500 $ de GEAR seront distribués aléatoirement via une tombola",
        reward_usd:
          "Partage du pool de prix de 40 000 $ en fonction de la force de nos votes communautaires !",
        token_drop: "Distribution de Tokens",
        worth_of_gear_drops: "Valeur des distributions de $GEAR",
        voting_period: "Période de vote : Jusqu'au 5 octobre, UTC 00:00",
        snapshot_period:
          "Instantané : 6 octobre (les déblocages avant cette date ne seront pas comptabilisés)",
        unstaking_available: "Déblocage : Disponible le 6 octobre",
      },
      label_rare_relics: "Reliques Rares",
      hours: "Heures",
      minutes: "Minutes",
      left: "Restant",
      label_ref_contest: "Concours Ref",
      label_ref_meme_contest: "Concours de Mèmes Ref - Phase 1",
      label_ref_meme_season: "Réf MEME Saison 6 - Phase 1",
      description_ref_meme_contest:
        "Participez au Concours de Mèmes Ref et obtenez des récompenses pour soutenir la communauté Meteor et $GEAR !",
      description_ref_meme_season:
        "Rejoignez le concours Ref MEME et obtenez des récompenses pour la communauté Meteor et $GEAR ! Chaque vote vous permet de gagner des tickets de tombola pour des prix exclusifs et une chance de remporter une part du pool de prix de 40 000 $—avec plus de récompenses à mesure que nos votes augmentent !",
      label_how_to_participate: "Comment participer",
      label_get_guaranteed_reward: "Obtenez un Contrat Avancé Garanti",
      label_stand_a_chance_to_win: "Ayez une chance de gagner",
      label_my_entry: "Ma Participation",
      text_campaign: "La saison des mèmes est en cours, participez pour gagner des récompenses.",
      label_milestone: "Jalon",
      label_votes_casted: "Votes Émis",
      step_1: {
        title: "Étape 1 : Acheter du Ref",
        description: "Vous avez besoin de REF pour participer au concours de mèmes et staker xREF",
        input_title: "Montant à Acheter",
        input_button: "Acheter",
      },
      step_2: {
        title: "Étape 2 : Stakez du Ref pour xRef",
        description: "Les tokens xREF vous donnent un pouvoir de vote et vous en avez actuellement",
        input_title: "Montant à Staker",
        input_button: "Staker",
        warning_success: "Staking de xRef Réussi",
      },
      step_3: {
        title: "Étape 3 : Votez pour Gear",
        description: "Chaque vote vous rapporte un ticket de tombola et vous en avez actuellement",
        input_title: "Montant à Voter",
        input_button: "Voter",
        warning_success: "Vote pour GEAR réussi",
      },
      step_unstake_xref_token: {
        title: "Déstaker le Token xRef",
        description:
          "Veuillez noter qu'il y aura une période de verrouillage de ~{LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} heures",
        label_locking_period: "Période de Verrouillage",
        label_total_staked_amount: "Montant Total Staké",
        input_title: "Montant à Déstaker",
        input_button: "Déstaker",
        warning_unstake_success: "Déstaking de xRef Réussi",
        warning_withdraw_success: "Retrait de xRef Réussi",
        description_unstaking:
          "Vous déstakez {balanceUnstaking} Token xRef. Cela prend généralement {LOCK_PERIOD_UNSTAKE_XREF_IN_HOURS} heures pour se compléter",
        description_claimReady:
          "Vous avez {balanceClaimReady} Token xRef prêt à être réclamé, cliquez pour réclamer maintenant",
      },
      step_unstake_ref_token: {
        title: "Débloquer le Token Ref",
        description:
          "Le déblocage instantané est disponible pour le Token Ref. Vous pouvez débloquer à tout moment",
        label_total_staked_amount: "Montant Total Mis en Jeu",
        input_title: "Montant à Débloquer",
        input_button: "Débloquer",
        warning_unstake_success: "Déblocage du Token Ref Réussi",
      },
      step_unstake_gear_token: {
        title: "Déstaker le Token GEAR",
        description:
          "Veuillez noter qu'il y aura une période de verrouillage de ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} jours",
        label_locking_period: "Période de Verrouillage",
        label_total_staked_amount: "Montant Staké",
        input_title: "Montant à Déstaker",
        input_button: "Déstaker",
        warning_unstake_success: "Déstaking de GEAR Réussi",
        warning_withdraw_success: "Retrait de GEAR Réussi",
        description_unstaking:
          "Vous déstakez {balanceUnstaking} Token GEAR. Cela prend généralement ~{LOCK_PERIOD_UNSTAKE_GEAR_IN_DAYS} jours pour se compléter",
        description_claimReady:
          "Vous avez {balanceClaimReady} Token GEAR prêt à être réclamé, cliquez pour réclamer maintenant",
        label_lock_up_period: "Période de Verrouillage",
        label_days: "Jours",
        label_apy: "APY",
      },
      label_you_have_gear: "Vous avez {prettyGearBalance} GEAR",
      label_reward_details: "Détails des Récompenses",
      label_participation_reward: "Récompense de Participation",
      description_participation_reward: "Récompense lorsque vous participez à ce concours",
      label_milestone_reward: "Récompense de Jalon",
      description_milestone_reward:
        "Chaque jalon ajoute plus d'articles au pool de tombola. Chaque ticket de tombola vous donne une chance de gagner une récompense.",
      label_my_raffle_tickets: "Mes Tickets de Tombola",
      label_raffle_rewards_in_milestone: "Récompenses de Tombola dans le Jalon",
      label_when_total_ticket_reached: "Lorsque le Total des Tickets est Atteint",
      label_dont_see_your_raffle_ticket: "Vous n'avez pas reçu vos tickets de tombola ? Vérifiez",
      label_dont_see_your_rewards: "Vous n'avez pas reçu vos récompenses ? Vérifiez",
      label_here: "ici",
      title_claim_raffle_ticket: "Réclamer le Ticket de Tombola",
      description_claim_raffle_ticket: "Trouvez les hachages de transaction liés au vote pour GEAR",
      label_input_transaction_hash: "Entrez le hachage de transaction",
      warning_claim_raffle_ticket_success: "Réclamation de Ticket de Tombola Réussie",
      button_claim: "Réclamer",
      button_claimed: "Réclamé",
      label_coming_soon: "Bientôt Disponible",
      label_staking_rewards: "Récompenses de Staking",
      label_list_of_registered_entries: "Liste des Participations Enregistrées",
      label_no_registered_entries: "Aucune participation enregistrée",
      button_dropped: "Déposé",
      label_you_didnt_win: "Vous n'avez gagné aucune récompense de tombola",
      label_coming_soon_unstaking: "Le déblocage sera disponible le 6 octobre",
      label_coming_soon_raffle: "Les récompenses de la tombola seront disponibles le 6 octobre",
    },
    configure_rpc: {
      title: "Sélecteur RPC",
      description: "Changer le réseau RPC actualisera l'application",
      button_add_rpc: "Ajouter RPC",
      warning_success_update_rpc: "Vous avez changé votre fournisseur RPC pour {rpc} avec succès",
      warning_rpc_abnormal_ping:
        "Le ping RPC est anormal, nous vous suggérons de changer pour un autre RPC.",
      warning_duplicate_entry: "Entrée RPC en double détectée.",
      label_add_custom_network: "Ajouter un Réseau Personnalisé",
      label_network_name: "Nom du Réseau",
      label_rpc_url: "URL RPC",
      button_add: "Ajouter",
      button_confirm_change_rpc: "Confirmer",
      rpcNames: {
        mainnet: {
          official: "RPC Officiel",
          meteor: "RPC Meteor FastNear",
          fastnear: "RPC FastNear",
          pagoda: "RPC Pagoda",
          lava: "RPC Lava",
          shitzu: "RPC Shitzu",
        },
        testnet: {
          official: "RPC Officiel testnet",
          fastnear: "RPC FastNear testnet",
          pagoda: "RPC Pagoda testnet",
          lava: "RPC Lava testnet",
        },
      },
      warning_changed_network: "Réseau changé pour {network}",
      hint_switch_network: "Appuyez sur CTRL + . pour basculer rapidement entre les réseaux",
    },
    wallet_status: {
      "": "",
      account_exists: "Vous pouvez changer votre référent pour ce compte",
      account_no_exists: "Le portefeuille n'existe pas",
      new_referrer_same_as_old_referrer:
        "Référent invalide : Le nouveau référent ne peut pas être le même que l'ancien référent.",
      current_lab_level_exceed_1:
        "Erreur : Vous avez déjà mis à jour votre laboratoire et ne pouvez plus changer de référent.",
      new_referrer_harvest_moon_not_init:
        "Référent invalide : Le référent n'a pas initialisé le compte de la lune de récolte.",
      new_referrer_not_tg_linked:
        "Référent invalide : Le référent doit être un portefeuille vérifié par Telegram principal.",
      new_referrer_must_be_primary_wallet:
        "Référent invalide : Le référent doit être un portefeuille vérifié par Telegram principal.",
      "responder_production_rate_exceed_0.1": "Erreur : Votre taux de production dépasse 0,1",
      error_checking: "Erreur : Quelque chose s'est mal passé, veuillez réessayer plus tard.",
    },
    changelog: {
      abuse: {
        title_1: "Mise à jour importante",
        title_2: "Concernant votre compte Harvest Moon",
        text_1: "En raison d'un bug récent dans Moon Exchange, vous avez reçu",
        text_2: "à un rabais de 50% avant que le bug ne soit corrigé le",
        text_3: "Pour garantir l'équité, nous avons supprimé les éléments suivants de votre compte",
        text_4: "En compensation pour le désagrément, nous vous offrons 1 Contrat Expert.",
        text_5:
          "Pour plus d'informations, veuillez cliquer sur le bouton En savoir plus ci-dessous.",
        text_6: "En cochant, vous confirmez que vous avez lu et compris la mise à jour.",
        label_contracts: "Contrats",
        button_view_transaction: "(Voir la transaction)",
        button_learn_more: "En savoir plus",
        button_understood: "Compris",
      },
      label_whats_new: "Quoi de neuf :",
      close: "fermer",
      "15": {
        title: "CUISINE DE MEME",
        description_1:
          "Une première plateforme de lancement équitable de son genre est maintenant en direct sur Near Protocol. Participez dès maintenant à leur",
        description_2: "campagne de trading !",
        button: "Cuisinez Maintenant",
      },
      "16": {
        title: "IMPORTER UN TOKEN",
        description:
          'Vous ne voyez pas le solde de votre token ? Importez-les dès maintenant en bas de la section "Mes Actifs" sur la page d\'accueil',
        button: "Vérifiez-le",
      },
      "17": {
        simple: "SIMPLE",
        fast: "RAPIDE",
        cheap: "PEU COÛTEUX",
        secure: "SÉCURISÉ",
        title: "Le pontage est devenu {simple}, {fast}, {cheap} et {secure}",
        description:
          "Déplacez facilement vos cryptos à travers les réseaux (ETH, SOL, BNB, ARB, etc.), tout cela dans votre portefeuille Meteor. Le cross-chain devient plus facile !",
        button: "Pont maintenant !",
      },
      "18": {
        title: "Missions en série lancées",
        description:
          "Accomplissez des missions quotidiennes : échangez des memecoins, des jetons de pont, des Tinkers de voyage dans le temps. Continuez la série pour de plus grosses récompenses !",
        button: "Démarrer des missions",
      },
      "19": {
        title: "Le Défi Memecoin est en direct !",
        description:
          "Échangez des memecoins maintenant pour avoir une chance de gagner votre part de 25 000 $ ! Augmentez votre série de transactions pour obtenir de plus grandes récompenses. Les 10 meilleurs traders obtiennent 10x de récompenses.",
        button: "Inscrivez-vous maintenant",
      },
      "20": {
        title: "Accès anticipé",
        subtitle:
          "Inscrivez-vous maintenant pour obtenir un accès anticipé et profiter d'avantages exclusifs.",
        button: "Postuler maintenant !",
      },
    },
    footer: {
      home: "Accueil",
      nft: "NFT",
      game: "$MOON",
      history: "Historique",
      explore: "Explorer",
    },
    topup: {
      title: "Recharger",
      label_intro_1: "Obtenez Votre",
      label_intro_2: "en quelques secondes",
      label_buy_with: "Acheter avec",
      label_recommended: "Recommandé",
      label_payment_options: "Options de paiement",
      text_mercuryo_description:
        "Acquérez directement des cryptomonnaies dans Meteor Wallet, sans documentation nécessaire.",
      text_onramper_description:
        "Agrégateur qui possède tous les principaux points d'entrée fiat-vers-crypto.",
      text_ramp_description:
        "Agrégateur qui possède tous les principaux points d'entrée fiat-vers-crypto.",
      toast: {
        topup_success_title: "Recharge réussie",
        topup_success_description: "Vos pièces ont été ajoutées à votre compte",
        topup_failed_title: "Échec de la recharge",
        topup_failed_description: "Veuillez réessayer plus tard",
      },
    },
    staking: {
      label_staking_apy: "Rendement Annuel",
      label_total_staked: "Total Misé",
      label_total_delegators: "Total des Délégués",
      label_daily_moon_drop: "Chute Quotidienne de $MOON",
      label_total_moon_earned: "Total de $MOON Gagné",
      label_per_day: "Par Jour",
      label_start_staking: "Commencez à Miser",
      label_boosted: "BOOSTÉ",
      hint_staking_apy:
        "Le rendement annuel en pourcentage de la mise de vos tokens NEAR est soumis aux conditions du réseau.",
      hint_total_staked:
        "Inclut le dépôt initial et les récompenses qui ont été automatiquement remisées.",
      hint_total_delegators: "Nombre de portefeuilles uniques misant sur ce validateur.",
      hint_daily_moon_drop:
        "Les tokens $MOON reçus quotidiennement sont basés sur le montant de NEAR que vous avez misé. Le montant recevable est calculé chaque heure en fonction de votre NEAR misé.",
      hint_total_moon_earned: "Total des tokens $MOON gagnés en misant avec le validateur Meteor.",
      button_stake_more: "Miser Plus",
      button_unstake: "Retirer la Mise",
      button_claim: "Réclamer",
      button_start_now: "Commencer",
      part_unstaking: {
        title: "Retrait de la Mise",
        description:
          "Vous retirez {balanceUnstaking} NEAR du validateur, cela prend généralement 48~72 heures pour se compléter",
      },
      part_unstaked: {
        title: "Mise Retirée",
        description:
          "Vous avez {balanceClaimReady} NEAR de récompenses non réclamées, cliquez pour réclamer maintenant",
      },
      part_extra_reward: {
        title: "Récompense Supplémentaire",
        description:
          "Vous avez {balanceExtraReward} de récompenses non réclamées, cliquez pour réclamer maintenant",
      },
      part_extra_reward_meteor: {
        title: "Vous gagnez des récompenses supplémentaires!",
        description_1:
          "Vous gagnerez des tokens $MOON chaque jour, crédités sur votre compte à {STAKING_AUTO_CLAIM_TIME}. Vérifiez votre",
        description_2: "activité de portefeuille",
        description_3: "pour les voir.",
      },
      part_unclaimed_reward: {
        title: "Récompense non réclamée",
        description:
          "Vous avez {balanceExtraReward} $MOON de récompenses non réclamées, commencez votre voyage Harvest Moon pour réclamer",
      },
      section_stakings: {
        title: "Mon Staking",
        button_create_staking: "Créer un Staking",
      },
      section_staking_stats: {
        title_1: "Gagnez avec",
        title_2: "Staking",
        description:
          "Gagnez jusqu'à {STAKING_UP_TO_APY}% de récompenses APY en faisant du staking de NEAR dans Meteor.",
        label_my_total_stakings: "Mes Mises Totales",
        label_estimated_apy: "APY Estimé",
      },
      subpage_create: {
        title: "Stakez Votre NEAR",
        label_year: "année",
        label_everyday: "chaque jour",
        label_validator: "Validateur",
        label_staking_details: "Détails du Staking",
        label_reward: "Retour Annuel",
        label_estimated_yield: "Retour Prévu",
        label_extra_reward: "Récompenses Bonus",
        label_extra_daily_reward_in_moon: "Récompenses Quotidiennes Supplémentaires en",
        label_select_validator: "Sélectionnez le Validateur",
        label_delegators: "Délégués",
        hint_reward:
          "Le rendement annuel en pourcentage de la mise de vos tokens NEAR est soumis aux conditions du réseau.",
        hint_estimated_yield:
          "Les gains annuels estimés en USD sont basés sur le taux de staking actuel et votre montant misé. Les gains réels seront en tokens NEAR.",
        hint_extra_reward:
          "Gagnez des tokens $MOON supplémentaires quotidiennement en bonus de staking. Ces tokens sont éligibles pour les futures récompenses de Meteor, comme notre airdrop officiel.",
        button_stake_now: "Stakez Maintenant",
        warning_unstake_period:
          "Il y a une période de verrouillage de 48~72 heures pendant le unstake",
      },
      toast: {
        unstake_success_title: "Vous avez retiré la mise avec succès",
        unstake_success_description:
          "Vous avez retiré {unstakeAmount} NEAR de {validatorId} avec succès",
        unstake_failed_title: "Échec du retrait de la mise",
        unstake_failed_description:
          "Échec de la réclamation de la récompense de staking: {message}",
        claim_success_title: "Réclamation réussie",
        claim_success_description:
          "Vous avez réclamé votre récompense de staking {amount} NEAR avec succès",
        claim_failed_title: "Quelque chose a mal tourné",
        claim_failed_description: "Échec de la réclamation de la récompense de staking: {message}",
        claim_farm_success_title: "Récompense de staking réclamée avec succès",
        claim_farm_success_description: "Vous avez réclamé votre récompense de staking avec succès",
        claim_farm_failed_title: "Quelque chose a mal tourné",
        claim_farm_failed_description:
          "Échec de la réclamation de la récompense de staking: {message}",
        no_claim_title: "Aucune récompense réclamable",
        no_claim_description: "Il n'y a aucune récompense réclamable",
      },
      modal: {
        unstake: {
          title: "Retirer la Mise",
          label_amount_to_unstake: "Montant à Retirer",
          label_validator_details: "Détails du Validateur",
          label_provider: "Fournisseur",
          label_staking_apy: "APY de Staking",
          label_unlock_period: "Période de Déverrouillage",
          label_total_staked_amount: "Montant Total Misé",
          button_confirm_unstake: "Confirmer le Retrait de la Mise",
        },
        stake: {
          label_stake_success: "Mise Réussie",
          label_stake_failed: "Échec de la Mise",
          label_transaction_details: "Détails de la Transaction",
          label_status: "Statut",
          label_success: "Succès",
          label_failed: "Échec",
          label_date_time: "Date & Heure",
          label_transaction_fee: "Frais de Transaction",
          label_transaction_id: "ID de Transaction",
          label_error_message: "Message d'Erreur",
          button_done: "Terminé",
        },
      },
    },
    telegram: {
      linking_wallet_to_account: "Lier le portefeuille au compte Telegram",
      quote_of_the_day: "Citation du jour",
      modal: {
        conflict_account: {
          title: "Vous avez déjà un portefeuille lié à votre compte Telegram",
          text_import: "Vous pouvez importer",
          text_import_or_create: "importer un autre portefeuille ou en créer un nouveau",
          text_if_import_or_create: "Si vous importez un autre portefeuille ou en créez un nouveau",
          text_telegram_account_override:
            "votre compte Telegram sera lié au nouveau portefeuille à la place",
          button_import_existing: "Importer",
          button_import_another: "Importer un autre portefeuille",
          button_create_new: "Créer un nouveau portefeuille",
          label_or: "ou",
        },
        connect_account: {
          title: "Lier le compte Telegram",
          description:
            "Un seul compte de portefeuille peut être lié à votre compte Telegram. Une fonctionnalité future vous permettra de changer le portefeuille auquel vous êtes lié.",
          button_continue: "Continuer",
        },
        import_linked_account: {
          title: "Importer votre compte existant",
          description:
            "Vous pouvez importer votre compte existant en utilisant votre phrase secrète ou votre clé privée",
          text_choose_import_method: "Choisissez la méthode d'importation",
          button_next: "Suivant",
          button_back: "Retour",
        },
      },
    },
    harvest_moon: {
      tab_harvest: {
        ledger: {
          title: "Autorisation d'accès sécurisé pour les utilisateurs de {LedgerComponent}",
          description:
            "Pour les utilisateurs de Ledger, l'ajout d'une clé d'accès aux appels de fonction est essentiel pour une expérience fluide sur Harvest Moon. Cette clé est uniquement destinée à la fonctionnalité de l'interface et ne nous donne pas accès à vos fonds ou aux clés de votre portefeuille personnel. Vos actifs restent entièrement sous votre contrôle.",
          add_now: "Ajouter maintenant",
        },
        section_dashboard: {
          label_storage: "Stockage",
          label_my_moon_balance: "Mon solde $MOON",
          button_next_harvest: "Prochaine récolte",
        },
        section_game_stats: {
          title: "STATISTIQUES DU JEU",
          label_coming_soon: "Bientôt disponible",
          text_news_mechanic: "Mécaniques de jeu et récompenses",
          text_news_guide: "Guide de jeu",
          text_news_launch_week: "La semaine de lancement de Harvest Moon est arrivée",
          text_news_hm_missions: "Missions Harvest Moon",
          button_relic_booster: "Boosters de reliques",
          button_player_level: "Niveau du joueur",
          button_ranking: "Classement",
          button_contract_drop: "Contrat déposé",
          button_token_drop: "Jeton déposé",
          button_referral: "Référence",
          label_enrolled: "Inscrit",
        },
        section_announcement: {
          title: "ANNONCE",
        },
        subpage_tier: {
          title: "Niveau du joueur",
          label_current_tier: "Niveau actuel",
          label_conditions_to_unlock: "Conditions pour débloquer",
          label_current_benefits: "Avantages actuels",
          label_upgrade_to_unlock: "Mettre à niveau pour débloquer",
          label_coming_soon: "BIENTÔT DISPONIBLE",
          button_uprgade_tier: "METTRE À NIVEAU",
          button_uprgade_tier_locked: "METTRE À NIVEAU (VERROUILLÉ)",
        },
        subpage_referral: {
          title: "Parrainage",
          label_last_7_days_earned_from_referral: "Gains des 7 derniers jours par parrainage",
          text_moon_earned_by_referral_is_distributed_to:
            "Les gains de Moon par parrainage sont distribués à {walletId}",
          label_your_primary_wallet: "votre portefeuille principal",
          label_my_total_friends: "Mon nombre total d'amis",
          button_copy_referral_link: "Copier",
          label_total_moon_earned_from_referral:
            "Total $MOON gagné grâce aux parrainages (7 derniers jours)",
          label_my_friends: "Mes amis",
          label_total_records: "Total de {count} enregistrements",
          label_total_moon_earned: "Total $MOON gagné",
          label_refer_and_earn: "Parrainez & Gagnez des récompenses",
          label_refer_and_earn_desc: "Parrainez un ami pour obtenir",
          label_refer_and_earn_desc_2: "20% de la récompense $MOON",
          label_refer_and_earn_desc_3: "et un",
          label_refer_and_earn_desc_4: "Contrat de base",
          label_level: "Niveau",
          label_wallet_id: "ID du portefeuille",
          label_telegram_id: "ID Telegram",
          label_last_harvest_at: "Dernière récolte à",
          button_remind_to_harvest: "Rappeler de récolter",
          button_share_on_tg: "Partager sur TG",
          button_share_on_x: "Partager sur X",
        },
        subpage_contract_drop: {
          title: "Contrat déposé",
          label_my_union_contract_drop_stats: "Mes statistiques de dépôt de contrat d'union",
          text_chance_of_getting_contract_at_full_storage:
            "Chance d'obtenir un contrat à pleine capacité de stockage",
          label_union_contract_drop_rate: "Taux de dépôt de contrat d'union",
          text_union_contract_drop_rate: `Vos chances d'obtenir un contrat d'union augmentent avec les heures que vous récoltez. L'amélioration de votre stockage vous permet de récolter plus d'heures (de 2h à 24h), augmentant vos chances. Le taux de dépôt maximum par récolte est de {dropRatePerHour}%.`,
          label_union_contract_type: "Type de contrat d'union",
          text_union_contract_type:
            "Débloquez différents types de contrats d'union en montant de niveau. Des niveaux de joueur plus élevés vous donnent accès à des contrats plus rares. Les chances de dépôt augmentent avec des niveaux de stockage plus élevés. Par exemple, un contrat d'expert a un taux de dépôt de 1% au niveau de stockage 1 mais augmente à 15% au niveau de stockage 9.",
          button_upgrade_storage: "Améliorer le stockage",
          button_check_player_level: "Vérifier le niveau du joueur",
        },
        subpage_token_drop: {
          title: "Distribution de Tokens",
          title_token_drop: "Distribution de Tokens",
          desc_token_drop:
            "Ayez une chance de gagner des tokens supplémentaires lorsque vous remplissez les critères de la campagne pendant la récolte.",
          label_campaign: "Campagne",
          label_met_criteria: "Éligible",
          label_not_met_criteria: "Non éligible",
          label_enrolled: "Inscrit",
          label_rewards: "Récompenses",
          label_period: "Période",
          label_claimed_rewards: "Récompenses Réclamées",
          button_view_details: "Voir les Détails",
          button_enroll: "S'inscrire",
          label_criteria: "Critères",
          label_completed: "Complété",
          label_incomplete: "Incomplet",
          label_player_level: "Niveau du Joueur",
          text_staked_at_least_100_near:
            "Mis en jeu (lien) au moins 100 Near avec Meteor Validator",
          button_enroll_now: "S'inscrire Maintenant",
          campaigns: {
            title: {
              referral_token_drop_2: "Parrainez & Gagnez",
              gear_token_drop: "Voyage dans le Temps & Gagnez",
              lonk_token_drop: "Défi des Nouveaux",
              memecoin_token_drop: "Trading de Memecoin",
              swap_mission_drop: "Défi Memecoin",
            },
            description: {
              referral_token_drop_2:
                "Invitez vos amis et gagnez des récompenses du pool de prix de 3 500 $ ! L'événement se déroule jusqu'à ce que le pool de prix soit entièrement réclamé, alors commencez à parrainer maintenant !",
              swap_mission_drop:
                "Rejoignez les missions quotidiennes de trading de Memecoin et concourez pour votre part d'un prize pool de 25 000 $ USDC ! L'événement se déroule jusqu'à ce que le pool soit entièrement réclamé, alors commencez à trader maintenant !",
            },
            how_it_works: {
              referral_token_drop_2: {
                step_1:
                  "Parrainez au moins <b>1 nouvel utilisateur qui recrute 5 Tinkers.</b> Une fois qualifié, votre prochaine récolte a 50% de chance d'obtenir une distribution de tokens supplémentaire <i>(Chance maximale avec une récolte de 4 heures)</i>",
                step_2:
                  "<b>Gagnez entre 0,05 $ et 10 $ en récompenses de tokens.</b> Plus vous parrainez, plus les récompenses sont importantes !",
                step_3:
                  "Un total de 120B Black Dragon (~3 500 $) sera distribué pendant cette campagne.",
                label_distributed: "Distribué",
                label_remaining: "Restant",
              },
              swap_mission_drop: {
                step_1_title: "Complétez une série de 5 jours",
                step_1_description:
                  "Échangez des memecoins pendant 5 jours consécutifs pour débloquer une chance de 50% de bonus à chaque récolte. Voir les memecoins éligibles.",
                step_2_title: "Récompenses",
                step_2_description:
                  "Gagnez des récompenses quotidiennes basées sur une récolte de 24 heures, allant de 0,75 $ à 2,50 $, en fonction de votre série et d'un facteur aléatoire. Des récoltes plus courtes signifient des récompenses plus petites. Les 10 meilleurs traders (par volume) peuvent gagner 10x de récompenses, jusqu'à 25 $ par jour.",
                step_3_title: "Cagnotte Totale",
                step_3_description: "Un total de 25 000 $ USDC sera distribué pendant la campagne.",
                label_distributed: "Distribué",
              },
            },
            my_progress: {
              swap_mission_drop: {
                complete_5_days_streak: "Complétez une série de 5 jours pour vous qualifier.",
                total_campaign_earnings: "Gains Totaux de la Campagne",
                earn_bonus_rewards: "Gagnez des Récompenses Bonus",
                top_10_trades_get: "Les 10 Meilleurs Échanges Obtiennent",
                rewards: "Récompenses",
                top_10_traders: "Top 10 Traders",
              },
            },
          },
          label_not_enrolled: "Non Inscrit",
          label_criteria_unmet: "Critères Non Remplis",
          label_status: "Statut",
          tooltip_status:
            "Inscrit : Vous êtes dans la distribution de tokens. Critères Non Remplis : Critères non remplis. Non Inscrit : Vous n'êtes pas inscrit.",
          label_until_reward_empty: "Jusqu'à ce que le pool de récompenses soit épuisé",
          campaign_status: {
            ACTIVE: "Actif",
            ENDED: "Terminé",
            PAUSED: "En Pause",
          },
          label_how_it_works: "Comment ça Marche",
          label_my_progress: "Ma Progression",
          label_qualification_status: "Statut de Qualification",
          label_recent_activity: "Activité Récente",
          label_you_have_referred: "Vous avez parrainé",
          label_users: "utilisateurs",
          description_qualification_status:
            "Les parrainages ne comptent qu'après avoir recruté 5 Tinkers, et seuls les nouveaux parrainages de cette campagne sont éligibles.",
          label_referral_activity: "Activité de Parrainage",
          label_tinkers: "Tinkers",
          label_prize_pool: "Pool de Prix",
          label_up_to: "Jusqu'à",
          label_each_harvest: "Chaque récolte",
          tooltip_rewards: "La récompense est calculée en fonction du prix en temps réel du token.",
          button_coming_soon: "ARRIVE BIENTÔT",
        },
        modal: {
          gas_free: {
            title:
              "Avec les transactions sans gaz, nous couvrons les frais pour un gameplay Harvest Moon sans faille!",
            button_close: "FERMER",
          },
          upgrade_tier: {
            title: "Mettre à niveau",
            label_upgrade_to_unlock: "Mettre à niveau pour débloquer",
            button_upgrade_now: "Mettre à niveau maintenant",
          },
          my_referrer: {
            label_my_referrer: "Mon Référent",
            label_wallet_id: "ID de Portefeuille",
            label_telegram_id: "ID Telegram",
            label_status: "Statut",
            label_lab_level: "Niveau de Laboratoire",
            button_update_referrer: "Mettre à Jour le Référent",
            footer_text:
              "Vous pouvez changer votre référent uniquement si votre taux de production est inférieur à 0,1 $MOON/heure.",
            label_active: "Actif",
            label_inactive: "Inactif",
            label_update_referrer: "Mettre à Jour le Référent",
            label_referrer_wallet_id: "ID de Portefeuille du Référent",
            button_confirm: "Confirmer la Mise à Jour",
            button_cancel: "Annuler",
          },
        },
        toast: {
          tier_upgrade_success: "Mise à niveau réussie",
          link_telegram_failed: "La liaison avec Telegram a échoué. Veuillez réessayer.",
          referral_telegram_failed:
            "Le compte existe déjà, impossible d'utiliser le lien de parrainage.",
          referred_and_get_reward_with_name:
            "Vous êtes parrainé par {referrer} et recevrez une récompense supplémentaire après avoir terminé la création de votre compte.",
          referred_and_get_reward_without_name:
            "Vous êtes parrainé et recevrez une récompense supplémentaire après avoir terminé la création de votre compte.",
        },
      },
      tab_mission: {
        newbie_challenge: {
          newbie: "Débutant",
          challenge: "Défi",
          of: "de",
          description:
            "Montez en niveau et améliorez votre configuration pour gagner des récompenses et améliorer votre gameplay !",
          prev: "Précédent",
          next: "Suivant",
          task: "Tâche",
          task_1: {
            join_harvest_moon: "Rejoignez Harvest Moon",
            receive_basic_contract: "Recevez une récompense de Contrat de Base !",
          },
          task_2: {
            reach_player_level_3: "Atteignez le Niveau 3 du Joueur",
            receive_advanced_contract: "Recevez une récompense de Contrat Avancé !",
          },
          task_3: {
            reach_container_level_3: "Atteignez le Niveau 3 du Conteneur",
            reach_lab_level_3: "Atteignez le Niveau 3 du Laboratoire",
            receive_expert_contract: "Recevez une récompense de Contrat Expert !",
            button_upgrade_now: "Améliorez Maintenant",
          },
        },
        new_missions: {
          active_forever: "Actif pour toujours",
          active_for: "Actif pendant",
          vote: "Vote",
          surprise_partnership_title: "Partenariat Surprise",
          surprise_partnership_desc: "Débloquez de nouvelles façons de dépenser des cryptos",
          meteor_master_card_desc: "Demander un accès anticipé",
          coming_soon: "Bientôt disponible",
          get_alpha_access_title: "Obtenez un accès Alpha",
          get_alpha_access_desc: "Soyez le premier à tester l'application de Meteor !",
          ended: "Terminé",
          staked: "Misé",
          delayed: "Retardé",
        },
        meme_season_7: {
          tab_title: {
            INFO: "Info",
            STAKE_VOTE: "Stake & Vote",
            UNSTAKE: "Désengager",
            MYREWARDS: "Mes Récompenses",
          },
          phase_1: {
            page_title: "Vote xRef",
            title_1: "Vote xRef",
            title_2: "(Phase 1 - Saison des Mèmes 10)",
            description:
              "Participez au concours Ref MEME et obtenez des récompenses pour soutenir la communauté Meteor et $GEAR!",
            tab_content: {
              info: {
                campaign_info: {
                  title: "Infos sur la Campagne",
                  voting_period: "Période de Vote",
                  voting_period_tooltip:
                    "Si vous avez déjà voté lors de la saison précédente, vous n'avez pas besoin de désengager pour voter à nouveau, vos votes seront comptés via Meteor ou Ref quoi qu'il arrive",
                  snapshot_period: "Instantané",
                  snapshot_period_desc:
                    "{snapshot_period} (Les désengagements avant cela ne comptent pas)",
                  unstaking_available: "Désengagement",
                  unstaking_available_desc: "Disponible le {unstaking_available}",
                  day_lock:
                    "Le désengagement sera disponible du 1er au 6 à 00:00 UTC le mois prochain.",
                  minimum_stake: "Mise Minimale",
                  minimum_stake_desc: "Misez au moins {amount} xRef pour participer",
                },
                participation_info: {
                  title: "Récompenses de Participation",
                  advanced_contract: "1x Contrat Avancé pour avoir voté au moins 1 fois",
                  raffle_ticket: "Tickets de Tombola pour chaque xRef/GEAR supplémentaire voté",
                },
                rewards_info: {
                  title: "Récompenses Potentielles de Tombola",
                  gear: "Jusqu'à 3 000 $ en $GEAR seront tirés au sort en fonction des étapes atteintes.",
                  contract:
                    "Jusqu'à 6 000 contrats avancés et 500 contrats experts fonction des étapes.",
                  token:
                    "Jusqu'à 50 000 $ de récompenses de la saison des mèmes en fonction de la force de vote de la communauté",
                },
                milestone_info: {
                  title: "Récompenses de Jalons",
                  description:
                    "Chaque jalon ajoute plus d'articles à la cagnotte de la tombola. Chaque ticket de tombola vous donne une chance de gagner une récompense.",
                },
              },
              unstake: {
                coming_soon: "Le désengagement sera disponible le {unstaking_available}",
                unstake_period:
                  "Veuillez noter qu'il y aura une période de verrouillage d'environ {days} jours",
                description_unstaking:
                  "Vous désengagez {balanceUnstaking} xRef Token. Cela prend généralement environ {days} jours pour se compléter",
              },
              myreward: {
                title: "Récompenses de Tombola",
                coming_soon: "Le résultat de la tombola sera annoncé le {raffle_reward}",
                button_claimed: "Réclamé",
                button_claimable: "Réclamer",
                button_not_qualified: "Non Qualifié",
              },
            },
          },
          phase_2: {
            page_title: "Vote xRef",
            title_1: "Vote xRef",
            title_2: "(Phase 2 - Saison des Mèmes 10)",
            description:
              "Participez au concours Ref MEME et obtenez des récompenses pour soutenir la communauté Meteor et $GEAR!",
            tab_content: {
              info: {
                campaign_info: {
                  title: "Infos sur la Campagne",
                  voting_period: "Période de Vote",
                  snapshot_period: "Instantané",
                  snapshot_period_desc:
                    "{snapshot_period} (Les désengagements avant cela ne comptent pas)",
                  unstaking_available: "Désengagement",
                  unstaking_available_desc: "Disponible le {unstaking_available}",
                },
                participation_info: {
                  title: "Récompenses de Participation",
                  advanced_contract: "1x Contrat Avancé pour avoir voté au moins 1 fois",
                  raffle_ticket: "Tickets de Tombola pour chaque xRef/GEAR supplémentaire voté",
                },
                rewards_info: {
                  title: "Récompenses Potentielles de Tombola",
                  gear: "Jusqu'à 3 000 $ en $GEAR seront tirés au sort en fonction des étapes atteintes.",
                  contract:
                    "Jusqu'à 6 000 contrats avancés et 500 contrats experts fonction des étapes.",
                  token:
                    "Jusqu'à 50 000 $ de récompenses de la saison des mèmes en fonction de la force de vote de la communauté",
                },
                milestone_info: {
                  title: "Récompenses de Jalons",
                  description:
                    "Chaque jalon ajoute plus d'articles à la cagnotte de la tombola. Chaque ticket de tombola vous donne une chance de gagner une récompense.",
                },
              },
              stake: {
                stake_period: "Stake au moins {stake_amount} GEAR pour obtenir un contrat avancé.",
              },
              unstake: {
                coming_soon: "Le désengagement sera disponible le {unstaking_available}",
                unstake_period:
                  "Veuillez noter qu'il y aura une période de verrouillage d'environ {days} jours",
                description_unstaking:
                  "Vous désengagez {balanceUnstaking} GEAR Token. Cela prend généralement environ {days} jours pour se compléter",
              },
              myreward: {
                title: "Récompenses de Tombola",
                coming_soon: "Le résultat de la tombola sera annoncé le {raffle_reward}",
                button_claimed: "Réclamé",
                button_claimable: "Réclamer",
                button_not_qualified: "Non Qualifié",
              },
            },
          },
        },
        section_challenge: {
          title: "Défi pour débutants",
          description:
            "Montez en niveau et améliorez votre configuration pour gagner des récompenses et améliorer votre gameplay !",
          button_start: "Commencer",
          label_challenge_list: "Liste des défis",
          button_remind_to_harvest: "Rappeler de récolter",
          button_claim: "Réclamer",
          label_tier: "Niveau",
          label_basic_info: "Informations de base",
          label_friend_quests: "Quêtes d'amis",
          label_last_7_days_contribution: "Contribution des 7 derniers jours",
          label_filter_by_status: "Filtrer par statut",
          label_active: "Actif",
          label_inactive: "Inactif",
          text_inactive: "Le joueur n'a pas initialisé la lune de récolte",
          button_filter: "Filtrer",
          label_no_friend_yet: "Pas encore d'ami",
          label_refer_and_earn_reward: "Parrainer & Gagner une récompense",
          text_share:
            "Cliquez sur le bouton de partage ci-dessus et commencez à inviter des amis !",
          label_refer_and_earn_desc: "Parrainez un ami pour obtenir",
          label_refer_and_earn_desc_2: "20% de la récompense en $MOON",
          label_refer_and_earn_desc_3: "et un",
          label_refer_and_earn_desc_4: "Contrat de base",
          button_verify_telegram: "Vérifiez votre compte Telegram maintenant",
          label_friend_list: "Liste d'amis",
          button_remind_to_harvest_all: "Rappeler de tout récolter",
          button_click_to_refresh: "Cliquez sur la liste d'amis pour voir plus de détails",
          label_tier_level: "Niveau de Tier",
          label_container_level: "Niveau du Conteneur",
          label_lab_level: "Niveau du Laboratoire",
        },
        section_profile: {
          label_player_tier: "Niveau du joueur",
          label_total_earned: "Total gagné",
        },
        section_missions: {
          text_upgrade_tier_not_tier_3:
            "Passez au niveau 3 pour débloquer des missions avec des récompenses attrayantes. À venir bientôt!",
          text_upgrade_tier_tier_3:
            "Restez tranquille et soyez prêt - nous lançons des missions bientôt!",
          button_upgrade_now: "Mettre à niveau maintenant",
          coming_soon: "ARRIVE BIENTÔT",
        },
        section_home: {
          missions: "Missions",
          mission: "Missions",
          coming_soon: "Bientôt disponible",
          title:
            "Gagnez des contrats, recrutez des Tinkers et augmentez les récompenses. Participez aux échanges et aux largages de tokens pour avoir une chance de gagner des prix en argent!",
          flash_missions: "Missions Flash",
          streak_missions: "Missions en Série",
          flash_mission_list: "Liste des Missions Flash",
          streak_mission_list: "Liste des Missions en Série",
          prize_pool: "Cagnotte",
          newbie_title: "Défi Débutant",
          newbie_subtitle: "Apprendre & Monter de Niveau",
          phase1_title: "Votez avec xRef",
          phase1_subtitle: "Phase 1 - Saison des Mèmes 10",
          phase2_title: "Votez avec $GEAR",
          phase2_subtitle: "Phase 2 - Saison des Mèmes 10",
          streak: "Série",
        },
        section_coming_soon: {
          title_xref: "Votez avec xRef",
          title_gear: "Votez avec $GEAR",
          subtitle_xref: "Votez avec xRef (Phase 1 - Saison des Mèmes 10)",
          subtitle_gear: "Votez avec $GEAR (Phase 2 - Saison des Mèmes 10)",
          coming_soon: "Bientôt disponible",
          title: "Votez avec xRef (Phase 1 - Saison des Mèmes 10)",
          days: "Jours",
          hours: "Heures",
          minutes: "Minutes",
          button_back: "Retour",
        },
        mission_content: {
          [EMissionSubType.SWAP_TO]: {
            title: "Échanger des Memecoins",
            description:
              "Échangez 5 $ ou plus en memecoins pour gagner un contrat de base. Maintenez votre séquence quotidienne pour monter de niveau plus rapidement et débloquer de plus grosses récompenses avec des jetons ! Si vous manquez une journée, votre séquence et votre volume total d'échange seront réinitialisés à {time} (0.00 UTC).",
            total_count: "Volume total: ${count}",
          },
          [EMissionSubType.BRIDGE_FROM]: {
            title: "Jetons de pont",
            description:
              "Utilisez le Meteor Bridge pour déplacer facilement des jetons entre différentes blockchains. Montez au moins 25 $ (dans les deux sens) pour gagner un contrat avancé. Maintenez votre séquence quotidienne pour monter de niveau plus rapidement et débloquer de plus grosses récompenses avec les drops de jetons ! Si vous manquez une journée, votre séquence et votre volume total d'échanges sont réinitialisés à {time} (0h00 UTC)",
            total_count: "Volume total: ${count}",
          },
          [EMissionSubType.HM_TIME_TRAVEL]: {
            title: "Voyage dans le temps Tinker",
            description:
              "Réussissez un voyage dans le temps avec n'importe quel Tinker pour gagner un contrat de base. Continuez votre séquence quotidienne pour monter de niveau plus rapidement et vous qualifier pour de plus grosses récompenses avec des jetons ! Manquez une journée et votre séquence se réinitialise à {time} (0h00 UTC)",
            total_count: "Volume total: {count}",
          },
        },
        section_mission_detail: {
          total_trade: "Commerce Total",
          day_streak: "Série de Jours",
          mission_details: "Détails de la Mission",
          eligible_tokens: "Tokens Éligibles",
          today_progress: "Progrès d'Aujourd'hui",
          mission_accomplished: "Mission Accomplie",
          continue_streak: "Continuez Votre Série Demain!",
          live: "LIVE",
          token_drop_rewards: "Récompenses de dépôt de jetons",
          usdc_giveaway: "Le largage de jetons USDC de 25 000 $ est en direct",
          streak_mission_list: "Liste des missions de la série",
          reward: "récompense",
          btn_letsgo: "Allons-y",
          btn_swap: "Échanger maintenant",
          btn_bridge: "Pont maintenant",
          btn_time_travel: "Voyage dans le temps maintenant",
          day1: "Lu",
          day2: "Ma",
          day3: "Me",
          day4: "Je",
          day5: "Ve",
          day6: "Sa",
          day7: "Di",
          view_info: "Voir les infos",
          see_more: "Voir plus",
        },
      },
      tab_tinker: {
        section_production_rate: {
          title: "Taux de production de Tinker",
          label_moon_per_hour: "$MOON/HEURE",
          button_recruit: "Recruter Tinker",
        },
        section_active_tinkers: {
          title: "MES TINKERS ACTIFS",
          subtitle: "{count} Tinkers",
          subtitleExtra: "Capacité du laboratoire",
          button_fusion: "Voyage dans le Temps",
          label_the: "Le",
          label_new_production_rate: "Nouveau Taux de Production",
          label_moon_per_hour: "$MOON/Heure",
          tooltip_fusion:
            "Améliorez votre Tinker en les envoyant dans une aventure de voyage dans le temps ! Chaque Tinker a un taux de réussite unique, et vous pouvez brûler des GEAR pour augmenter leurs chances. Cependant, si votre Tinker échoue, vous le perdrez.",
        },
        section_union_contracts: {
          title: "CONTRATS D'UNION",
          subtitle: "Total {count} contrats",
        },
        toast: {
          recruiting_tinker: "Recrutement de bricoleur(s)",
          recruit_tinker_failed: "Le recrutement du bricoleur a échoué. Veuillez réessayer.",
        },
        modal: {
          no_new_mph: {
            title:
              "Le nouveau bricoleur recruté n'améliore pas le taux de production global car votre alignement actuel est plus efficace, ce qui ne permet pas d'augmenter le MPH. Envisagez d'améliorer votre laboratoire pour augmenter votre taux de production.",
          },
          tinker_fusion: {
            title: "Voyage dans le temps",
            description: "Améliorez votre tinker à un tout nouveau niveau !",
            label_how_many: "Combien",
            label_to_fusion: "voyager dans le temps",
            label_burn: "Brûler",
            label_to_increase_success_rate: "pour augmenter le taux de réussite",
            label_total_moon_cost: "Coût total en $MOON",
            label_total_gear_cost: "Coût total en GEAR",
            label_balance: "Solde",
            label_success_rate: "Taux de Réussite",
            label_info: "Si le voyage dans le temps échoue, votre Tinker sera perdu.",
            button_start_fusion: "Commencer le Voyage dans le Temps",
            warning_not_enough_gear: "Vous n'avez pas assez de GEAR.",
            button_buy_now: "Acheter Maintenant",
          },
          tinker_production_rate: {
            title: "Présentation de la production Tinker",
            subtitle:
              "Votre laboratoire déploiera automatiquement les Tinkers les plus efficaces en premier. {upgrade} pour augmenter la capacité ou utiliser {relics} pour augmenter les taux de production.",
            upgrade: "Mettre à niveau votre laboratoire",
            relics: "Relics",
            desc1: "Stagiaire recruté :",
            desc2: "Stagiaire déployé :",
            desc3: "Taux de production actif :",
            totalTinkers: "Nombre total de Tinkers : ",
            labCapacity: "Capacité du laboratoire : ",
            relic_boost: "Relic Boost",
            production_rate: "Taux de production",
          },
        },
      },
      tab_upgrade: {
        section_lab_stats: {
          title: "STATISTIQUES DU LABO",
          label_container: "Conteneur",
          label_moonlight_storage: "Stockage de clair de lune",
          label_lab_capacity: "Capacité du labo",
          label_maximum_tinker: "Bricoleur maximum",
          button_upgrade: "Améliorer",
        },
        section_experiments: {
          title: "EXPÉRIENCES GEAR",
          label_relics: "Reliques",
          label_moon_exchange: "Échange $MOON",
          label_boost: "Boost",
          label_left: "Gauche",
          text_countdown_info:
            "L'échange de $MOON est disponible pendant encore {countdown} jours.",
        },
        subpage_gear_relics: {
          title: "Reliques GEAR",
          label_unlock_relic_slot: "Déverrouiller l'emplacement de relique",
          text_unlock_relic_slot: "pour déverrouiller un nouvel emplacement de relique",
          label_current_balance: "Solde actuel",
          button_buy_gear: "Acheter de l'équipement",
          section_boost_rate: {
            label_boost_rate: "Taux de Boost",
            label_equipped_relics: "Reliques Équipées",
          },
          section_forge_relic: {
            label_forge_relic: "Forger Relique",
            label_burn_gear_1: "Brûler",
            label_burn_gear_2: "pour obtenir une nouvelle relique",
            label_buy_sell_relic: "Acheter/Vendre des Reliques",
            text_buy_sell_relic: "Obtenez votre NFT Relique via le Marché",
            label_harvest_moon_relic: "Reliques de Harvest Moon",
            text_harvest_moon_relic: "Obtenez 10% de Boost",
            label_union_contract_relic: "Reliques de Contrat d'Union",
            text_union_contract_relic: "Obtenez 50% de Boost",
            label_gear_relic: "Reliques d'Équipement",
            label_other_relic: "Autres Reliques",
            label_gear_relic_on_paras: "Reliques d'équipement sur Paras",
            label_gear_relic_on_tradeport: "Reliques d'équipement sur Tradeport",
            text_gear_relic: "Obtenez de 25% à 250% de Boost",
          },
          section_relics: {
            title: "Reliques Disponibles",
            label_drop_rate: "Taux de chute",
            label_rarity: "Rareté",
            label_boost_rate: "Taux de Boost",
            label_total: "Total",
            label_unequip: "Déséquiper",
            label_unequip_cooldown: "Cooldown de Déséquipement",
            text_maturity: "Vous ne pouvez déséquiper un équipement équipé qu'après {days} jours",
            warning_no_relics:
              "Vous n'avez pas de reliques. Forgez-en une maintenant ou achetez-en sur Paras.",
          },
        },
        subpage_moon_exchange: {
          title: "Échange MOON",
          label_select_asset_to_exchange_with: "Sélectionnez l'actif à échanger",
          label_conversion_rate: "Taux de conversion",
          label_click_to_start_convert: "Cliquez sur la liste pour commencer la conversion",
          section_exchange: {
            title: "ÉCHANGE",
            label_asset_to_receive: "Actif à recevoir",
            label_asset_to_exchange_with: "Actif à échanger",
            label_you_are_going_to_convert: "Vous allez convertir",
            label_to: "en",
            button_conversion_rate: "Taux de conversion",
            button_convert: "Convertir",
          },
        },
        toast: {
          exchange_success: "Échange réussi de {from} pour {to}",
          forging_relic: "Forgeage",
          forging_relic_success: "Forgeage réussi",
          unlocking_relic_slot: "Déverrouillage",
          unlocking_relic_slot_success: "Emplacement de relique déverrouillé avec succès",
          equip_relic_success: "Équipé avec succès",
          unequip_relic_success: "Déséquipé avec succès",
          upgrade_container_success: "Mise à niveau du conteneur réussie",
          upgrade_lab_success: "Mise à niveau du laboratoire réussie",
          sunset_gear: "Le staking GEAR sera terminé",
          button_unstake: "Désinvestir ici",
          button_forge: "Forger ici",
          button_close: "Fermer",
          button_equip: "Équiper",
          button_unlock: "Déverrouiller maintenant",
        },
      },
      relic_rarity: {
        [EHarvestMoon_RelicRarity.common]: "Commun",
        [EHarvestMoon_RelicRarity.uncommon]: "Peu commun",
        [EHarvestMoon_RelicRarity.rare]: "Rare",
        [EHarvestMoon_RelicRarity.legendary]: "Légendaire",
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
          hold_3_near_in_your_wallet_description: "Gardez 3 NEAR dans votre portefeuille",
          hold_3_near_in_your_wallet_button: "Dépôt",
          set_a_password_for_your_wallet_description:
            "Définissez un mot de passe pour votre portefeuille",
          set_a_password_for_your_wallet_button: "Définir le mot de passe maintenant",
          backup_your_seedphrase_description: "Sauvegardez votre phrase de récupération",
          backup_your_seedphrase_button: "Sauvegarder maintenant",
          stake_5_near_in_meteor_validator: "Stake",
          stake_5_near_in_meteor_validator_description: "Stake 5 NEAR dans le validateur Meteor",
        },
      },
      wallet_link: {
        wallet_link: "Lien de Portefeuille",
        pick_wallet_to_link: "Choisissez le portefeuille que vous souhaitez lier",
        link_selected_account: "Lier le Compte Sélectionné",
        linked_to: "Lié à",
        button_back_to_home: "Retour au Portefeuille",
        modal: {
          title: "Période de Verrouillage",
          description:
            "Veuillez noter que vous ne pouvez changer votre portefeuille lié que 72 heures après le dernier changement.",
          button_confirm: "Confirmer le Lien du Compte",
          button_back: "Retour",
        },
      },
      wallet_link_select_primary: {
        primary_wallet_explanation:
          "Tous les gains de parrainage sont envoyés à votre portefeuille principal. Ce portefeuille a également l'avantage de ne pas avoir de frais de transaction.",
        confirm_primary_wallet: "CONFIRMER LE PORTEFEUILLE PRINCIPAL",
        primary_wallet: "PORTEFEUILLE PRINCIPAL",
      },
      new_onboarding: {
        label_player_name: "NOM DU JOUEUR",
        label_creating_account: "CRÉATION DE COMPTE",
        label_linking_telegram: "LIEN AVEC TELEGRAM",
        label_not_enough_balance: "SOLDE INSUFFISANT",
        label_adding_access_key: "AJOUT DE CLÉ D'ACCÈS",
        label_initializing_account: "INITIALISATION DU COMPTE",
        text_disclaimer_starting:
          "Assurez-vous que votre portefeuille a {startingFee} NEAR pour les frais de réseau",
        text_disclaimer_consumed:
          "Une petite somme de {consumedNetworkFee} NEAR sera dépensée pour les frais de réseau et de stockage",
        button_create_account: "CRÉER UN COMPTE",
        button_next: "SUIVANT",
        button_start: "DÉMARRER",
        modal: {
          deposit: {
            title: "Prêt à MOON ?",
            description:
              "Assurez-vous que vous avez vérifié votre TG ou que vous avez un compte de dépôt avec NEAR pour démarrer",
            text_your_telegram_has_been_linked: "Votre telegram a déjà un portefeuille principal",
            label_or: "ou",
            button_verify_telegram_account: "Vérifier le compte Telegram",
            button_deposit_near: "Déposer {startingFeeDisplayed} NEAR",
          },
          insufficient_balance: {
            title: "🔥 Oups, NEAR insuffisant pour le gaz",
            description_1: "La plupart des transactions coûtent moins de 0,01 NEAR.",
            description_2:
              "Cependant, le protocole NEAR utilise une estimation de gaz pessimiste pour couvrir le pire des cas pendant les heures de pointe.",
            description_3: "Veuillez vous assurer que vous avez",
            description_4: "au moins 0,2 NEAR",
            description_5: "dans votre portefeuille pour profiter d'une expérience sans faille.",
            button_top_up: "Obtenez plus de Near maintenant",
          },
        },
      },
      maintenance: {
        title: "Mise à jour du jeu en cours",
        description:
          "Harvest Moon est temporairement en pause pour une mise à niveau du contrat afin de vous offrir une expérience plus fluide.",
        footer: "Nous serons de retour dans environ 4 heures—merci de votre patience!",
        label_migration_notice: "Avis de migration",
        button_learn_more: "En savoir plus",
      },
      social_onboarding: {
        join_telegram: "REJOIGNEZ NOTRE CHAÎNE TELEGRAM",
        join_twitter: "SUIVEZ METEOR SUR X",
        complete_to_start: "Complétez les étapes ci-dessous pour commencer",
        ready_to_start: "Prêt à commencer !",
        start: "DÉMARRER",
      },
      landing: {
        title: "VOUS N'ÊTES PAS SUR LA LISTE BLANCHE",
        button_apply_now: "POSTULER MAINTENANT",
        button_back_to_meteor: "RETOUR À MÉTÉORE",
      },
      main: {
        text_wallet_address: "ADRESSE DU PORTEFEUILLE",
        text_total_moon_token: "Total du jeton $MOON",
        text_max: "MAX",
        text_per_hour: "$MOON/HEURE",
        text_harvesting: "RÉCOLTE",
        text_full_moon: "PLEINE LUNE",
        text_moon_balance: "SOLDE",
        warning_connect_telegram:
          "Connectez votre compte Telegram pour obtenir quotidiennement 10 frais de gaz gratuits !",
        warning_save_credentials:
          "Veuillez sauvegarder votre phrase de récupération et votre clé privée pour éviter de perdre votre progression !",
        warning_storage_full: "ESPACE DE STOCKAGE PLEIN",
        button_harvest: "Récolter",
        button_next_harvest: "PROCHAINE RÉCOLTE",
        button_harvest_moon: "RÉCOLTER $MOON",
        button_to_wallet: "ALLER AU PORTEFEUILLE",
      },
      onboarding: {
        main: {
          title: "INTÉGRATION",
          description:
            "Votre nouveau chapitre dans l'univers de Meteor Wallet vous attend ! Complétez quelques étapes simples pour vous embarquer dans votre aventure.",
          label_link_telegram: "LIEN DU COMPTE TELEGRAM",
          description_link_telegram:
            "Liez votre portefeuille à Telegram pour profiter d'une expérience de jeu sans frais de gaz !",
          label_add_access_key: "AJOUTER UNE CLÉ D'ACCÈS",
          description_add_access_key:
            "Ajoutez des permissions (clé d'accès à la fonction d'appel) à votre compte pour l'expérience Harvest Moon.",
          label_initialize_account: "INITIALISER LE COMPTE",
          description_initialize_account: "Initialisez votre compte de jeu avec un Tinker offert.",
          label_go_to_moon: "ALLER SUR LA LUNE",
          description_go_to_moon:
            "Votre voyage sur la lune est prêt ; commencez la récolte maintenant.",
          message_linked: "Lié à",
          message_linked_no_tg: "Le portefeuille est lié à un autre compte Telegram",
          message_not_linked: "Le compte Telegram n'est pas lié",
          message_tg_linked: "Telegram est lié à ce portefeuille",
          message_gas_free: "Vous êtes éligible pour un jeu sans frais de gaz",
          message_network_fee:
            "Des frais de réseau minimes sont requis pour un compte non vérifié par Telegram",
          message_deposit_fee: "Cela nécessite un dépôt de stockage NEAR de 0.003",
          warning_wallet_already_linked:
            "Le portefeuille était lié à un autre compte Telegram. Veuillez utiliser un autre portefeuille.",
          button_link: "LIEN MAINTENANT",
          button_add: "AJOUTER MAINTENANT",
          button_init: "INITIALISER MAINTENANT",
          button_go: "ALLER MAINTENANT",
        },
        warning: {
          title: "LIER VOTRE PORTEFEUILLE À TELEGRAM",
          text_basic_union_contract: "contrat(s) d'union de base",
          text_gas_free: "Sans frais de gaz",
          text_transaction: "transactions",
          text_new_access_key_required:
            "Une nouvelle clé d'accès est nécessaire pour la mise à jour de Harvest Moon",
          message:
            "En liant votre portefeuille ({wallet_id}) à votre compte Telegram ({username}), vos récompenses de parrainage accumulées seront réclamées. Lier à Telegram vous donnera les avantages ci-dessous :",
          warning: "Les récompenses ne peuvent pas être transférées une fois réclamées",
          button_proceed: "Continuer",
          button_cancel: "Annuler",
        },
        step_1: {
          message:
            "Bienvenue dans Harvest Moon—votre nouveau chapitre dans l'univers de Meteor Wallet vous attend ! Êtes-vous prêt à vous lancer dans ce voyage et à réclamer vos récompenses ?",
          button_continue: "CLIQUEZ POUR CONTINUER",
        },
        step_2: {
          message_not_verified:
            "Créons votre compte, rapidement et facilement—cela ne prendra que 30 secondes. Prêt ?",
          message_verified:
            "Tout d'abord, nous allons rapidement configurer votre compte—cela ne prend que 30 secondes. Sans lien vers Telegram, il y a des frais de réseau minimes (environ 0,003N) pour les transactions. Prêt à commencer ?",
          option_continue: "Oui, allons-y",
          option_cancel: "Non, ramenez-moi à Meteor Wallet",
        },
        step_3: {
          message:
            "Pour commencer, nous ajouterons une clé d'accès fonctionnelle à votre compte, permettant des interactions transparentes avec le contrat Harvest Moon.",
          button_continue: "Faisons-le",
          button_try_again: "Réessayer",
        },
        step_4: {
          message_setting_up_account:
            "Super, votre compte est en cours de configuration. Attendez un peu pendant que nous préparons les choses !",
          message_not_enough_balance:
            "Vous n'avez pas assez de solde pour initialiser le compte. Veuillez recharger votre compte avec NEAR et réessayer.",
          option_try_again: "Réessayer",
          option_back: "Revenir en arrière",
        },
        step_5: {
          message: "C'est parti ! Allons à la LUNE !",
          button_ok: "D'accord",
        },
      },
      tab: {
        title: {
          harvest: "RÉCOLTE",
          tinker: "BRICOLEURS",
          upgrade: "AMÉLIORATIONS",
          mission: "MISSIONS",
        },
        lumen_lab: {
          title_lab_stats: "STATISTIQUES DU LABO",
          label_container: "CONTENEUR",
          text_upgrade_container:
            "UTILISEZ LE JETON $MOON POUR AMÉLIORER VOTRE CONTENEUR, POUR UNE RÉCOLTE PLUS LONGUE",
          label_lab_capacity: "CAPACITÉ DU LABO",
          text_upgrade_lab:
            "UTILISEZ LE JETON $MOON POUR AUGMENTER VOTRE CAPACITÉ DE LABO POUR RECRUTER PLUS DE BRICOLEURS",
          text_hour: "HEURE",
          text_moonlight_storage: "STOCKAGE DE LUMIÈRE LUNAIRE",
        },
        tinker_recruitment: {
          text_moon_per_hour: "$MOON/HEURE",
          text_active_tinkers: "BRICOLEURS ACTIFS",
          text_total_tinkers: "TOTAL DES BRICOLEURS",
          text_lab_capacity: "CAPACITÉ DU LABO",
          text_available_union_contracts: "Contrats syndicaux disponibles",
          warning_min_tinker_count: "Recrutez au moins 1 Bricoleur",
          button_recruit: "RECRUTER",
        },
        portal_referral: {
          text_coming_soon: "Plus de détails sur vos amis seront bientôt affichés ici.",
          text_my_frens: "MES AMIS",
          text_moon_earned: "$MOON GAGNÉ",
          warning_no_telegram: "Connectez-vous à Telegram pour partager",
          warning_link_telegram:
            "Liez votre portefeuille à Telegram pour accéder aux liens de parrainage et commencer à gagner des récompenses",
          button_share_on_tg: "PARTAGER SUR TG",
          button_share_on_x: "PARTAGER SUR X",
          button_copy_referral_link: "COPIER LE LIEN DE PARRAINAGE",
          button_link_to_telegram: "Lien vers Telegram",
          content_share_on_x: `Récolter MOON? C'est la façon la plus simple de jouer et de gagner dans le monde de la crypto - propulsé par @MeteorWallet

🚀 Gagner: $MOON = Meteor #airdrops

Prêt à rejoindre?
👇Les 3 premiers clics gagnent un ticket d'or pour la Beta`,
          content_share_on_tg: `Récolter MOON? C'est la façon la plus simple de jouer et de gagner dans le monde de la crypto - propulsé par Meteor Wallet

🚀 Gagner: $MOON = Meteor #airdrops

Prêt à rejoindre?
👇Les 3 premiers clics gagnent un ticket d'or pour la Beta`,
        },
        setting: {
          warning_link_telegram_success: "Compte Telegram lié avec succès",
          button_link_to_telegram: "LIER LE PORTEFEUILLE À TELEGRAM",
          button_give_feedback: "DONNER VOTRE AVIS",
          button_view_secret_phrase: "VOIR LA PHRASE SECRÈTE",
          button_export_private_key: "EXPORTER LA CLÉ PRIVÉE",
          button_quit_game: "QUITTER LE JEU",
        },
      },
      modal: {
        unopen_reward: {
          title: "Félicitationsz!",
          description: "Vous avez obtenu",
          reward_id: "ID de Récompense",
          from: "De",
          button_cool: "Cool !",
        },
        link_to_telegram: {
          title: "LIEN VERS TELEGRAM",
          description:
            "Recevez des mises à jour de jeu directes et devenez éligible à notre programme de parrainage",
          text_dont_show_again: "Ne plus afficher",
          button_link_wallet: "LIEN PORTEFEUILLE",
        },
        upgrade: {
          container: {
            title: "AMÉLIORER LE STOCKAGE",
            description:
              "UTILISEZ LE JETON $MOON POUR AMÉLIORER VOTRE CONTENEUR POUR UNE PLUS LONGUE RÉCOLTE",
          },
          lab: {
            title: "AMÉLIORER LE LABO",
            description:
              "UTILISEZ LE JETON $MOON POUR AMÉLIORER VOTRE LABO POUR RECRUTER PLUS DE BRICOLEURS",
          },
          label_current_level: "NIVEAU ACTUEL",
          label_upgrade_level: "NIVEAU D'AMÉLIORATION",
          text_moon: "$MOON",
          button_upgrade: "AMÉLIORER",
        },
        maintenance: {
          title: "AVIS DE MAINTENANCE",
          description:
            "Nous avons réussi à migrer vers un nouveau contrat intelligent pour améliorer votre expérience de jeu. Si votre solde de Tinkers ou $MOON ne semble pas correct, faites-le nous savoir.",
          button_report_issue: "Signaler un problème",
        },
        leaderboard: {
          title: "Classement",
          loading: "Chargement des données du classement",
          text_rank: "Rang",
          text_player_name: "Nom du joueur",
          text_moon_hr_rate: "$MOON/Heure",
          text_total_players: "Total de {count} joueurs",
          button_close: "FERMER",
          label_boost: "Booster",
          button_rank_higher: "Conseils pour monter en rang",
          button_share: "Partager",
          mission_menu_title: {
            SWAP_TO: "Mission de Trading de Memecoin",
            HM_TIME_TRAVEL: "Mission de Voyage dans le Temps",
            BRIDGE_FROM: "Mission de Pont",
          },
          mission_value1_title: {
            SWAP_TO: "Volume d'échange",
            HM_TIME_TRAVEL: "Voyage dans le temps",
            BRIDGE_FROM: "Volume transféré",
          },
          streak: "Série",
          tinker_lab_rankings: "Classement du laboratoire",
          streak_rankings: "Classement de la série",
        },
        promo: {
          title: "🌕 Rejoignez Harvest MOON!",
          description_1:
            "Votre nouvelle façon simple de jouer et de gagner dans le monde de la crypto:",
          description_2: "🎮 Jouez : Des tâches amusantes pour des récompenses",
          description_3: "🌙 Récoltez : Obtenez des jetons $MOON",
          description_4: "🚀 Gagnez : $MOON = Gouttes de météores",
          button_go: "Allons-y !",
        },
        menu: {
          title: {
            [EHarvestMoon_Menu.home]: "",
            [EHarvestMoon_Menu.lab]: "LABORATOIRE LUMEN",
            [EHarvestMoon_Menu.tinker]: "RECRUTEMENT DE BRICOLEURS",
            [EHarvestMoon_Menu.referral]: "PORTAIL DE PARRAINAGE",
            [EHarvestMoon_Menu.quest]: "QUÊTES CRYPTO",
            [EHarvestMoon_Menu.setting]: "PARAMÈTRES",
          },
          description: {
            [EHarvestMoon_Menu.home]: "",
            [EHarvestMoon_Menu.lab]:
              "Améliorez votre conteneur pour des périodes de récolte plus longues et augmentez la capacité du labo pour recruter plus de bricoleurs.",
            [EHarvestMoon_Menu.tinker]:
              "Utilisez des contrats pour le recrutement basé sur la chance des bricoleurs qui récoltent la lumière de la lune à des taux variables.",
            [EHarvestMoon_Menu.referral]:
              "Chaque ami invité vous rapporte un contrat syndical de base + 20 % de leur $MOON, à vie.",
            [EHarvestMoon_Menu.quest]:
              "Des missions qui renforcent vos compétences en cryptographie et tirent parti de la puissance de la finance décentralisée à votre avantage.",
            [EHarvestMoon_Menu.setting]: "",
          },
        },
        harvest_summary: {
          not_eligible: "Non éligible",
          label_click_to_reveal_prize: "Cliquez pour révéler le prix",
          label_you_have_won: "Vous avez gagné un",
          label_and_token_drop: "et un jeton drop",
          label_won_token_drop: "Vous avez gagné un jeton drop",
          button_click_to_continue: "Cliquez pour continuer",
          contract_type: {
            basic: "CONTRAT DE BASE",
            advanced: "CONTRAT AVANCÉ",
            expert: "CONTRAT D'EXPERT",
          },
          title: "Résumé de la Récolte",
          description:
            "Votre récolte est terminée ! Voyez comment vos Tinkers ont performé et si vous avez rempli les conditions pour des contrats ou des largages de jetons",
          congratulations: "Félicitations",
          contract_drop: "Largage de Contrat",
          token_drop_campaign: "Largage de Jetons",
          criteria_not_met_title: "Critères non remplis",
          criteria_not_met_desc:
            "Vous n'avez pas rempli les critères de la campagne, voulez-vous votre part des 25 000 $ USDC ?",
          win_rate: "Taux de Réussite",
          better_luck_next_time_title: "Bonne chance la prochaine fois",
          better_luck_next_time_desc_1: "Améliorez vos chances en mettant à niveau votre compte",
          better_luck_next_time_desc_2: "Le largage de jetons est toujours une chance de 50/50",
          you_have_won: "Vous avez gagné",
          learn_more: "En savoir plus",
          you_got: "Vous avez obtenu",
          view_more: "Voir plus",
          traded: "Échangé",
          text_upgrade_container:
            "Un stockage $MOON plus élevé augmente votre taux de largage et la taille de votre récolte.",
          text_upgrade_tier: {
            one: "Niveau 1 – Vous ne remplissez les conditions que pour les Contrats de Base.",
            two: "Niveau 2 – Vous remplissez les conditions pour les Contrats de Base et Avancés.",
            three:
              "Niveau 3 – Vous remplissez les conditions pour les Contrats de Base, Avancés et Experts.",
          },
          subtitle: "REÇU DE LA RÉCOLTE",
          label_container_size: "TEMPS TOTAL",
          label_lab_capacity: "LABORATOIRE LUMEN",
          label_total_moon_tokens: "TOTAL DE $MOON",
          text_moon: "$MOON",
          text_moon_harvested: "Récolté",
          text_moon_per_hour: "$MOON / Heure",
          text_union_contract_chance: "LOTERIE CONTRAT SYNDICAL !",
          text_harvest_and_win: "RÉCOLTEZ ET GAGNEZ",
          text_tinkers: "BRICOLEURS",
          text_get_referral:
            "Gagnez des récompenses en partageant ceci sur X! (lien de parrainage inclus)",
          label_win: "FÉLICITATIONS",
          text_win: "Vous avez gagné un {contract_type} !",
          label_lose: "LA PROCHAINE FOIS !",
          text_lose: "RÉCOLTEZ À NOUVEAU POUR VOTRE CHANCE À UN CONTRAT SYNDICAL !",
          button_close: "Fermer",
          share_on_x: "Partager sur X",
          rank: "Rang",
          content_share_on_x: `Mon dernier Résumé de la Récolte : les Tinkers m'aident à récolter des jetons $MOON gratuits pour les futures distributions

Qu'est-ce que Harvest Moon ? Le moyen le plus simple de jouer et de gagner de la crypto, tout cela via @MeteorWallet

𝗣𝗿𝗲̂𝘁 𝗮̀ 𝗷𝗼𝗶𝗻𝗱𝗿𝗲?
Les 3 premiers clics gagnent un ticket d'or pour la Beta`,
          label_upgrade_your_account: "Améliorez votre compte",
          label_harvesting_longer_hours: "Récolte sur des heures plus longues",
          label_enhance_your_moon_container: "Améliorez votre Conteneur MOON",
          button_upgrade: "Améliorez Maintenant",
          button_enhance: "Améliorez Maintenant",
          label_next_time: "LA PROCHAINE FOIS !",
          text_next_time: "Oups, améliorez vos chances de sécuriser un contrat union en :",
          label_new_moon_balance: "Solde $MOON",
          label_drop_rate: "Taux de Chute",
          hint_drop_rate:
            "Plus vous récoltez longtemps, plus votre taux de drop de contrat est élevé. De plus, votre niveau de joueur et les améliorations de votre conteneur influencent également vos drops de contrat.",
          label_no_drop: "Pas de Chute",
          label_drop: "Abandonner",
          reward: "Récompense",
          result: "Résultat",
          win: "Gagner",
          try_again: "Réessayer",
          win_odd: "Taux de réussite",
          random_odd: "Chance de lancer",
        },
        recruitment: {
          text_recruit_with: "RECRUTER AVEC",
          text_tinkers_to_recruit: "Combien de bricoleurs voulez-vous recruter ?",
          warning_max_tinker_count: "Vous ne pouvez recruter au maximum que",
          button_use_max: "UTILISER MAX",
          button_recruit: "RECRUTER",
        },
        recruitment_reveal: {
          text_the: "LE",
          text_moon_per_hour: "$MOON / HEURE",
          button_skip: "SAUTER",
          button_click_to_continue: "CLIQUEZ POUR CONTINUER",
        },
        recruitment_summary: {
          title: "RÉSUMÉ DU RECRUTEMENT",
          text_mph: "MPH",
          text_new_mph: "NOUVEAU MPH",
          button_ok: "OK",
          share_on_x: "PARTAGER SUR X",
          label_max_capacity_reached: "Capacité maximale du laboratoire atteinte",
          button_details: "Détails",
          button_upgrade_lab: "Mettre à niveau le labo maintenant",
          content_share_on_x: `Mon nouveau recrutement Tinker : ils m'aident à récolter des jetons $MOON gratuits pour les futures distributions

Qu'est-ce que Harvest Moon ? Le moyen le plus simple de jouer et de gagner de la crypto, tout cela via @MeteorWallet

𝗣𝗿𝗲̂𝘁 𝗮̀ 𝗷𝗼𝗶𝗻𝗱𝗿𝗲?
Les 3 premiers clics gagnent un ticket d'or pour la Beta`,
          text_get_more_contract: "OBTENEZ PLUS DE CONTRATS EN PARTAGEANT CECI SUR X",
          text_referral_link: "LIEN DE PARRAINAGE AJOUTÉ AUTOMATIQUEMENT",
        },
        fusion_summary: {
          title: "Résumé du Voyage dans le Temps",
          label_total_travelled: "Total Voyage",
          label_total_success: "Total Réussi",
          label_total_failed: "Total Échoué",
        },
        account_verified: {
          title: "COMPTE VÉRIFIÉ",
          description: "Votre compte Telegram a été vérifié.",
          button_ok: "OK",
        },
        coming_soon: {
          title: "PROCHAINEMENT",
        },
        warning: {
          title: "AVERTISSEMENT",
          button_ok: "OK",
        },
        production_guide: {
          title: "RÉCOLTE DE LA LUMIÈRE LUNAIRE",
          text_moon_per_hour: "$MOON/HEURE",
          text_with: "AVEC",
          text_hour: "HEURE",
          text_container: "CONTENEUR",
          text_max_harvest: "MAX RÉCOLTE",
          text_get_more_moon: "Plus de $MOON/heure ?",
          text_get_more_hours: "Plus d'heures ? ",
          link_get_tinkers: "Obtenir des bricoleurs",
          link_upgrade_container: "Améliorer le conteneur",
        },
        storage_guide: {
          title: "STOCKAGE DE LUMIÈRE LUNAIRE",
          link_upgrade_container: "Améliorer le conteneur",
          text_your_storage: "Votre stockage est",
          text_full_and_fills: "plein et se remplit",
          text_every: "toutes les",
          text_hours: "heures",
          text_want_more_hours: "Voulez-vous plus d'heures ?",
        },
        tinker_guide: {
          title: "MANUEL DE L'EXPLORATEUR",
          text_moon: "$MOON",
          text_harvest_rates: "TAUX DE RÉCOLTE",
          text_every_hour: "CHAQUE HEURE",
        },
      },
      tinker: {
        name: {
          "1": "Stagiaire",
          "2": "Chercheur",
          "3": "Scientifique",
          "4": "Génie",
          "5": "Cerveau",
        },
      },
      contract: {
        name: {
          [EHM_UnionContractTypes.basic]: "De base",
          [EHM_UnionContractTypes.advanced]: "Avancé",
          [EHM_UnionContractTypes.expert]: "Expert",
        },
        fullname: {
          [EHM_UnionContractTypes.basic]: "CONTRAT DE BASE",
          [EHM_UnionContractTypes.advanced]: "CONTRAT AVANCÉ",
          [EHM_UnionContractTypes.expert]: "CONTRAT EXPERT",
        },
        description: {
          [EHM_UnionContractTypes.basic]:
            "Recrute principalement des stagiaires, parfois des chercheurs",
          [EHM_UnionContractTypes.advanced]:
            "Recrute principalement des scientifiques, parfois des génies",
          [EHM_UnionContractTypes.expert]:
            "Recrute principalement des génies, parfois des cerveaux",
        },
      },
      tinker_phase: {
        title: {
          [EHarvestMoon_TinkerGuideModalPhase.active_tinker]: "BRICOLEURS ACTIFS",
          [EHarvestMoon_TinkerGuideModalPhase.union_contract]: "CONTRATS SYNDICAUX",
        },
        description: {
          [EHarvestMoon_TinkerGuideModalPhase.active_tinker]:
            "Plus de Tinkers que d'espace ? Nous mettons les meilleurs au travail. Assurez-vous que votre laboratoire dispose de suffisamment de place pour tirer le meilleur parti de vos Tinkers.",
          [EHarvestMoon_TinkerGuideModalPhase.union_contract]:
            "Utilisez des contrats pour le recrutement basé sur la chance des bricoleurs qui récoltent la lumière de la lune à des taux variables.",
        },
      },
      share: {
        telegram: `𝗩𝗼𝘂𝘀 𝗮𝗶𝗺𝗲𝘇 𝗷𝗲 𝗲𝗻𝘁𝗲𝗻𝘁𝗲𝗻𝗱𝘂 𝗱𝗲 𝗛𝗮𝗿𝘃𝗲𝘀𝘁 𝗠𝗢𝗢𝗡 ? Je viens de rejoindre et c'est pratiquement la manière la plus simple de jouer et de gagner dans le monde de la crypto - propulsé par Meteor Wallet.

🎮 𝗝𝗼𝘂𝗲𝘇 : Des tâches amusantes pour des récompenses

🌙 𝗛𝗮𝗿𝘃𝗲𝘀𝘁 : Attrapez les jetons $MOON

🚀 𝗘𝗮𝗿𝗻 : $MOON = largages Meteor

𝗣𝗿𝗲̂𝘁 𝗮̀ 𝗷𝗼𝗶𝗻𝗱𝗿𝗲?
Les 3 premiers clics gagnent un ticket d'or pour la Beta
`,
      },
    },
    common: {
      transaction_not_safe_ids: {
        [ETransactionNotSafeId.not_safe_delete_account]: {
          title: "Suppression de compte détectée",
          desc: "Il semble qu'une application externe essaie de supprimer votre compte dans cette transaction. Nous empêchons l'exécution de cette transaction. Veuillez utiliser directement le portefeuille Meteor si vous souhaitez supprimer votre compte.",
        },
        [ETransactionNotSafeId.not_safe_deploy_contract]: {
          title: "Déploiement de contrat détecté",
          desc: "Il semble qu'une application externe essaie de déployer un contrat sur votre compte dans cette transaction. Cette action n'est pas sûre. Nous empêchons l'exécution de cette transaction.",
        },
        [ETransactionNotSafeId.not_safe_add_key_full_access]: {
          title: "Ajout de clé d'accès complet détecté",
          desc: "Il semble qu'une application externe essaie d'ajouter une clé d'accès complet à votre compte dans cette transaction. Cela leur permettrait de vider votre compte. Nous empêchons l'exécution de cette transaction.",
        },
        [ETransactionNotSafeId.not_safe_delete_key_full_access]: {
          title: "Suppression de clé d'accès complet détectée",
          desc: "Il semble qu'une application externe essaie de supprimer une clé d'accès complet de votre compte dans cette transaction. Cela pourrait vous empêcher d'accéder à votre compte. Nous empêchons l'exécution de cette transaction.",
        },
      },
      error_ids: {
        [EOldMeteorErrorId.merr_account_access_key_not_found]:
          "Impossible de localiser la clé d'accès au compte.",
        [EOldMeteorErrorId.merr_sign_message_verify_mismatch]:
          "Échec de la vérification. La signature ne correspond pas.",
        [EOldMeteorErrorId.merr_account_signed_request_mismatch]:
          "Échec de la vérification. Incohérence détectée dans la requête signée.",
        [EOldMeteorErrorId.merr_account_signed_request_not_full_access_key]:
          "La requête ne correspond pas à une clé d'accès complète.",
        [EOldMeteorErrorId.merr_enrollment_failed]: "Échec de l'enregistrement de la mission",
        [EOldMeteorErrorId.merr_enrollment_failed_no_gas]:
          "Solde insuffisant. Veuillez recharger pour continuer.",
        [EOldMeteorErrorId.merr_reward_redeem_failed]:
          "Échec de la transaction. Impossible de récupérer la récompense.",
        [EOldMeteorErrorId.merr_reward_redeem_failed_no_gas]:
          "Solde insuffisant. Veuillez recharger pour continuer.",
        [EOldMeteorErrorId.merr_reward_claim_ft_failed]:
          "Échec de la demande de récompense de jeton.",
        [EOldMeteorErrorId.merr_reward_claim_ft_failed_no_gas]:
          "Solde insuffisant. Veuillez recharger pour continuer.",
        [EOldMeteorErrorId.merr_reward_claim_nft_failed]: "Échec de la demande de récompense NFT.",
        [EOldMeteorErrorId.merr_reward_claim_nft_failed_no_gas]:
          "Solde insuffisant. Veuillez recharger pour continuer.",
        [EOldMeteorErrorId.merr_unwrap_near_failed]: "Échec du processus de déballage NEAR.",
        [EOldMeteorErrorId.merr_profile_update_failed]: "Échec de la mise à jour du profil.",
        [EOldMeteorErrorId.merr_profile_update_pfp_failed]:
          "Échec de la mise à jour de l'image de profil.",
        [EErrorId_AccountSignerExecutor.signer_executor_stale_execution]:
          "Exécution obsolète. Tentative d'exécution d'un processus obsolète.",
        [EErrorId_AccountSignerExecutor.signer_executor_execution_cancelled]:
          "Exécution annulée. Arrêt du processus initié par l'utilisateur.",
        [EErrorId_AccountSignerExecutor.signer_executor_execution_not_finished]:
          "Exécution interrompue. Processus non encore terminé.",
        [EErrorId_AccountSignerExecutor.signer_executor_only_cancel_async_signing]:
          "Annulation refusée. Le processus de signature asynchrone ne peut pas être annulé.",
        [EErrorId_AccountSignerExecutor.signer_executor_ordinal_state_nonexistent]:
          "Erreur de l'exécuteur de signataire : État ordinal inexistant",
        [EErrorId_AccountSignerExecutor.signer_executor_step_index_nonexistent]:
          "Erreur de l'exécuteur de signataire : Index d'étape inexistant",
        [EErrorId_AccountSignerExecutor.publishing_transaction_not_signed]:
          "Transaction non signée. Signature rejetée sur l'appareil Ledger.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed]:
          "Échec de la transaction. Échec du processus de publication.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_final_execution_outcome]:
          "Échec de la transaction. Échec du processus de publication.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_receipt_execution_outcome]:
          "Échec de la transaction. Échec du processus de publication.",
        [EErrorId_AccountSignerExecutor.publishing_transaction_failed_near_error]:
          "Échec de la transaction. Échec du processus de publication.",
        [EErrorId_AccountSignerExecutor.publishing_delegated_transaction_failed]:
          "Échec de la transaction. Échec du processus de publication.",
        [EErr_NearLedger.ledger_user_rejected_action]:
          "L'utilisateur a refusé l'action sur l'appareil Ledger.",
        [EErr_NearLedger.ledger_invalid_data_received]:
          "Données invalides. Données incorrectes ou corrompues reçues de Ledger.",
        [EErr_NearLedger.ledger_transaction_data_too_large]:
          "Données dépassent la limite. La taille des données de transaction est trop grande pour Ledger.",
        [EErr_NearLedger.ledger_unknown_transport_error]:
          "Erreur de transport. Problème de transmission de données inconnu avec Ledger.",
        [EErr_NearLedger.ledger_device_locked]:
          "Appareil verrouillé. Veuillez le déverrouiller et réessayer.",
        [EErr_NearLedger.ledger_near_app_not_open]:
          "L'application NEAR de l'appareil n'est pas ouverte. Veuillez l'ouvrir sur votre Ledger et réessayer.",
        [EErr_NearLedger.ledger_device_unknown_error]:
          "Erreur inconnue. Problème non identifié avec l'appareil Ledger.",
        [EErr_NearLedger.ledger_unknown_transport_status_error]:
          "Erreur de transport. Problème de transmission de données inconnu avec Ledger.",
        [EErr_NearLedger.ledger_unable_to_process_instruction]:
          "Impossible de traiter l'instruction.",
        [EErr_NearLedger.ledger_device_connection_refused]:
          "Erreur de connexion. Connexion de l'appareil à Ledger refusée.",
        [EErr_NearLedger.ledger_device_browser_refresh_needed]:
          "Le navigateur doit être actualisé.",
      },
      errors: {
        title_unknown_error: "Erreur inconnue",
        desc_unknown_error:
          "Une erreur inconnue s'est produite. Veuillez en informer l'équipe Meteor.",
      },
      maintenance: {
        title_maintenance: "Nous sommes en maintenance",
        desc_maintenance:
          "Veuillez revenir bientôt, nous apportons quelques petites améliorations à de jolies mises à jour.",
      },
    },
    services: {
      near: {
        networkNames: {
          [ENearNetwork.testnet]: "réseau d'essai",
          [ENearNetwork.betanet]: "Réseau bêta",
          [ENearNetwork.mainnet]: "réseau principal",
          [ENearNetwork.localnet]: "réseau local",
        },
        networkNamesShort: {
          [ENearNetwork.testnet]: "test",
          [ENearNetwork.betanet]: "Beta",
          [ENearNetwork.mainnet]: "principale",
          [ENearNetwork.localnet]: "local",
        },
      },
      refresh: {
        refreshText: "rafraîchir",
        updatingText: "mise à jour",
      },
      copy: {
        common: "{données} copiées",
        copy_id: "Copier l'ID du portefeuille",
        wallet: "ID de portefeuille copié",
      },
      delete: {
        common: "Supprimer le compte",
        delete: "Effacer",
        delete_this_account: "Supprimer ce compte",
        delete_this_account_note:
          "Voulez-vous vraiment supprimer ce compte de votre portefeuille ?",
      },
      fund: {
        almost_there: "Presque là !",
        check_now: "Vérifie maintenant",
        checking: "Vérification...",
        send_at_least:
          "Envoyez au moins 0,1 Near à votre adresse de portefeuille pour activer le compte",
        fund_via_testnet: "Financer via Testnet",
        checking_again_in: "Vérification à nouveau",
        error_occurred:
          "Une erreur s'est produite lors de l'interrogation de l'état du portefeuille",
      },
      user: {
        needLogin: "Vous devez être connecté pour effectuer cette action.",
      },
    },
    buttonText: {
      createNewAccount: "créer un nouveau portefeuille",
      importAccount: "Importer un portefeuille existant",
      updateText: "renouveler",
      continueText: "Continuez",
      confirmText: "Confirmer",
      createWallet: "Créer un portefeuille",
    },
    sidebarUi: {
      button_addWallet: "ajouter un portefeuille",
      button_signOut: "verrouiller le portefeuille",
      button_settings: "d'installation",
      noWalletBlurb: "Créez ou importez un nouveau portefeuille pour commencer",
      notSignedInBlurb: "Connectez-vous pour accéder à votre portefeuille",
    },
    mainUi: {
      menu_button_wallets: "porte monnaie",
      heading_myAssets: "mes atouts",
      button_deposit: "Top Up",
      button_send: "envoyer",
      button_stake: "gage",
      button_swap: "échanger",
      button_explore: "Explorer",
      button_bridge: "pont",
      updating: "mise à jour...",
    },
    pageContent: {
      walletConnect: {
        blurb_noAccountFound:
          "Impossible de trouver le compte de portefeuille Meteor pour se connecter à une application externe",
      },
      linkdrop: {
        title_incorrect_link_format: "Oups, une erreur s'est produite",
        description_incorrect_link_format:
          "Format de lien incorrect. Veuillez vérifier votre URL et réessayer",
        title_drop_claimed: "Le drop a été réclamé.",
        description_drop_claimed:
          "Ce drop NEAR a déjà été réclamé. Les drops NEAR ne peuvent être utilisés que pour créer un seul compte, puis le lien expire.",
        title_received_drop: "Vous avez reçu un drop NEAR!",
        title_received_ft_drop: "Vous avez reçu {symbol} drop!",
        description_received_drop: "Réclamez avec un compte existant ou créez un nouveau compte",
        claim: "Réclamer",
        claim_with_following_account: "Réclamer avec le compte suivant:",
        claim_with_new_account: "Réclamer avec un nouveau compte",
        claim_success_title: "Confirmé",
        claim_success_description: "Vous avez réussi à réclamer le drop",
        claim_success_with_redirect_description:
          "Vous avez réclamé avec succès la récompense et vous serez bientôt redirigé vers l'application.",
        something_went_wrong_title: "Quelque chose s'est mal passé",
        something_went_wrong_description: "Veuillez réessayer plus tard ou utiliser un autre lien.",
        or: "Ou",
      },
      linkdropClaimedSuccess: {
        title: "Drop réclamé",
        subtitle: "Les actifs offerts ont été ajoutés à votre portefeuille avec succès !",
        button_redirect: "Retour au site",
      },
      topup: {
        heading_get_near: "Obtenez $NEAR",
        buy_near: "Achetez $NEAR",
        onramper_description: "Agrégateur qui a toutes les principales rampes d'accès fiat-crypto",
        bridge_from_eth_aurora: "Pont d'Ethereum/Aurora",
        rainbow_bridge_description: "Pont entre ou envoyer au sein d'Ethereum NEAR et Aurora",
        supported_cex: "Échanges centralisés pris en charge",
        okx_description: "Découvrez la crypto au sommet de l'un des monde",
        binance_description:
          "Le premier écosystème blockchain et échange d'actifs numériques au monde.",
        huobi_description: "Le premier échange mondial",
        kraken_description: "Kraken est votre pont vers le monde de la cryptographie.",
      },
      extensionConnect: {
        blurb_extensionInstalled:
          "L'accès à votre compte est désormais également disponible via ,l'extension !",
        title_extensionInstalled: "Extension Meteor installée",
        button_text_continueToApp: "Continuez",
      },
      walletHome: {
        subtext_availableFunds: "Solde disponible",
        tooltip_availableFunds:
          "Votre solde disponible n'inclut pas les fonds bloqués ou jalonnés.",
        warning_needsRecoveryBackup: "Phrase de récupération du portefeuille non sauvegardée",
        warning_needsRecoveryBackup_desc:
          "Sauvegardez la phrase de départ de votre portefeuille pour éviter la perte d'actifs",
        warning_needsRecoveryBackup_btn: "Back up maintenant",
        warning_insecureWallet: "Portefeuille non chiffré",
        warning_insecureWallet_desc:
          "Définissez un mot de passe pour protéger votre portefeuille via le cryptage des données sensibles",
        warning_insecureWallet_btn: "Mettre à jour le mot de passe",
        warning_networkIssue_title: "Problèmes de réseau",
        warning_networkIssue_desc:
          "Le réseau Near Protocol fait face à une congestion. Les transactions pourraient être plus lentes que d'habitude et certaines fonctionnalités pourraient être temporairement inaccessibles.",
        warning_scamTokenCount: "{count} jeton d'arnaque est masqué",
        warning_scamTokenCount_multi: "{count} jetons frauduleux sont masqués",
        warning_hiddenTokenCount: "{count} token de petit solde caché",
        warning_hiddenTokenCount_multi: "{count} tokens de petit solde cachés",
        button_updates: "Mises à jour",
        tooltip_recent_updates: "Vous pouvez trouver les dernières mises à jour ici",
        tooltip_total_balance: "Solde Total",
        tooltip_storage_reserve: "Réserve de Stockage",
        tooltip_gas_reserve: "Réserve de Gaz",
        tooltip_spendable: "Disponible",
        import_token: {
          title: "Importer un Token",
          description: "Entrez l'adresse du token pour l'importer dans votre portefeuille",
          placeholder: "Rechercher l'adresse du token ...",
          button_add_token: "Ajouter le Token Sélectionné",
          market_price: "Prix du Marché",
          my_balance: "Mon Solde",
          my_balance_in_usd: "Mon Solde en USD",
          warning_please_enter_token: "Veuillez entrer l'adresse du contrat du token ci-dessus",
          warning_invalid_token: "L'adresse du token que vous avez saisie est invalide",
          toast_title_token_added: "Token Ajouté avec Succès",
          toast_text_token_added: "Vous avez ajouté le token avec succès",
        },
      },
      addressBook: {
        text_noAddressesFound: "Adresse introuvable",
        heading_otherOwnedAccounts: "votre autre portefeuille",
        heading_savedAccounts: "adresse enregistrée",
        heading_recentlyUsedAccounts: "adresse la plus récemment utilisée",
      },
      walletDeposit: {
        heading_deposit: "verser",
        text_copy_wallet: "Copier l'ID du portefeuille",
      },
      walletSwap: {
        swap: "Échanger",
        confirm_swap: "Confirmer l'échange",
        something_wrong: "Quelque chose s'est mal passé",
        failed_build_transaction: "Échec de la création de la transaction",
        preparing_transaction: "Préparation de votre transaction",
        getting_transaction_ready: "Préparez votre transaction.",
        executing_step: "Étape d'exécution",
        calling: "Appel",
        you_receive: "Vous recevez",
        you_pay: "Tu payes",
        swap_successful: "Échange réussi",
        swap_success_desc: "Vous avez échangé vos jetons avec succès",
        swap_failed: "Échec de l'échange",
        swap_failed_desc:
          "Quelque chose s'est mal passé. Veuillez vérifier l'historique de vos transactions pour plus de détails.",
        close: "proche",
        review_swap: "Échange d'avis",
        route_not_found: "Itinéraire introuvable",
        inadequate_balance: "Solde inadéquat",
        show_all_routes: "Afficher tous les itinéraires disponibles",
        to_contract: "contracter",
        do_no_close_page: "Veuillez ne pas fermer cette page ou rafraîchir votre navigateur",
        provider: "Fournisseuse",
        price_impact: "Incidence sur les prix",
        meteor_fee: "Frais Meteor",
        meteor_fee_desc: "Aucun frais, seulement les meilleurs taux",
        provider_fee: "Frais du Fournisseur",
        network_fee: "Frais de réseau",
        swap_fee: "Frais d'échange",
        route: "Itinéraire",
        minimum_received: "Minimum reçu",
        best_route: "Meilleur itinéraire",
        find_token_hint: "Rechercher un jeton avec des symboles de jeton, un nom ou une adresse",
        label_swap_details: "Détails de l'échange",
        label_please_enter_amount: "Veuillez entrer le montant",
        label_select_token: "Sélectionner un jeton",
        hint_search_token: "Rechercher le symbole, le nom ou l'adresse du jeton",
        label_slippage: "Glissement",
        button_confirm: "Confirmer",
        title_slippage: "Paramètre de glissement",
        desc_slippage:
          "Votre transaction échouera si le prix change plus que le glissement. Une valeur trop élevée entraînera une transaction défavorable.",
        // label_support_fees:
        //   "Le devis inclut {METEOR_SWAP_FEE}% de frais Meteor pour soutenir l'équipe",
        label_support_fees:
          "Nous ne facturons aucun frais pour le moment, mais des frais peuvent être ajoutés à l'avenir.",
        label_loading: "Chargement",
        label_fees: "Frais",
        label_quote: "Citation",
        label_error_message: "Message d'erreur",
        label_successful: "Réussi",
        description_success:
          "Votre transaction a été complétée avec succès ! Les tokens échangés sont maintenant disponibles dans votre portefeuille.",
        description_failed:
          "L'échange a échoué en raison d'un mouvement de prix au-delà de votre tolérance de glissement (${oldSlippage}%). Réessayez avec une tolérance plus élevée (${suggestedSlippage}%).",
        label_swap_summary: "Résumé de l'Échange",
        label_you_send: "Vous Envoyez",
        label_you_received: "Vous Avez Reçu",
        button_back_to_home: "Retour à l'Accueil",
        button_back_to_redirect_url: "Retour à l'URL de redirection",
        button_try_again: "Réessayer",
        title_slippage_error: "Oups, Erreur de Glissement !",
      },
      walletStake: {
        liquid_staking: "Jalonnement liquide",
        standard_staking: "Jalonnement standard",
        liquid_staking_desc:
          "Misez votre NEAR pour recevoir des jetons de mise. Vous pouvez ensuite les réinvestir.",
        standard_staking_desc: "Verrouillez votre NEAR pour recevoir ~10 % d'APY",
        create_new_staking: "Créer un nouveau jalonnement",
        create_new_staking_desc: "Gagnez des récompenses maintenant en bloquant votre NEAR !",
        my_staked_validators: "Mes validateurs jalonnés",
        display_newly_staked_note:
          "Cela peut prendre environ 1 minute pour afficher votre nouveau validateur jalonné.",
        search_validator: "Validateur de recherche",
        load_more: "Charger plus",
        something_wrong: "Quelque chose s'est mal passé",
        staking_failed: "Le jalonnement a échoué",
        staking_failed_went_wrong: "Le jalonnement a échoué : quelque chose s'est mal passé",
        unstake_failed_went_wrong: "Échec de la désactivation : une erreur s'est produite",
        you_stake: "Vous misez :",
        you_unstake: "Vous annulez :",
        unstake_failed: "Le retrait a échoué",
        staked_success: "Implanté avec succès",
        staked_success_msg: "Vous avez misé avec succès",
        unstaked_success: "Désemballé avec succès",
        unstaked_success_msg: "Vous avez réussi à vous désengager",
        review_staking: "Réviser le jalonnement",
        review_unstaking: "Réviser le désengagement",
        validator_details: "Détails du validateur",
        confirm: "Confirmer",
        staking: "Jalonnement",
        stake: "Pieu",
        unstake: "Décoller",
        to: "À",
        from: "De",
        create_liquid_staking: "Créer un jalonnement liquide",
        liquid_unstake: "Liquide Unstake",
        minimum_liquid_note: "Le montant minimum de mise liquide est",
        staking_details: "Détails de jalonnement",
        you_are_staking: "Vous misez",
        staking_with: "avec",
        days: "Journées",
        estimated_earnings: "Les revenus estimés",
        select_your_validator_pool: "Sélectionnez votre validateur/pool",
        select_validator: "Sélectionnez le validateur",
        insufficient_balance: "Solde insuffisant",
        use_max: "Utiliser Max",
        available: "Disponible",
        create_standard_staking: "Créer un jalonnement standard",
        amount_to_unstake_in: "Montant à désengager",
        active: "Actif",
        reward_token_s: "Jeton(s) de récompense",
        inactive: "inactif",
        total_staked: "Total jalonné",
        estimated_apy: "APY estimé",
        staked_near: "Implanté PRÈS",
        staked_near_tooltip:
          "Montant du quasi jalonné. Les récompenses en jetons NEAR sont automatiquement remises en jeu.",
        unclaimed_reward: "Récompense non réclamée",
        unclaimed_reward_tooltip:
          "Récompenses qui ont été gagnées, mais non retirées. Les récompenses en jetons NEAR sont automatiquement recalculées.",
        you_unstaking: "Vous désamorcez",
        usually_take_72_hour_unstake:
          "et il faut généralement 48 à 72 heures pour retirer le jalonnement",
        unstaked_ready_to_claimed: "Votre fonds non jalonné est prêt à être réclamé",
        claim_unstaked: "Réclamation non jalonnée",
        stake_more: "Misez plus",
        claim_reward: "Réclamation récompense",
        provider: "Fournisseuse",
        liquid_unstake_fee: "Frais de désengagement liquide",
        unlock_period: "Déverrouiller la période",
        total_near_staked: "Total NEAR jalonné",
        balance: "Solde",
        value_in_near: "Valeur en NEAR",
        and_it_usually_takes: "et il faut généralement",
        to_unstake: "dépiquer",
        delayed_unstake: "Unstake retardé",
      },
      walletSend: {
        heading_send: "envoyer",
        input_heading_sendTo: "envoyer à",
        button_useMax: "utiliser au maximum",
        input_heading_selectAsset: "sélectionner l'actif",
        text_accountIdInfo:
          "L'ID de compte doit contenir le compte de niveau supérieur, tel que .near ou exactement 64 caractères.",
        input_placeHolder_sendTo: "Envoyer à l'ID de compte",
        tooltip_addressBook: "carnet d'adresses",
        use_max: "utiliser au maximum",
        available: "Disponible",
        no_account_provide: "Aucun compte fourni",
        account_id_note_1: "L'identifiant du compte doit être valide, tel que",
        account_id_note_2: "ou contenir exactement 64 caractères.",
        account_id_note_3:
          "L'ID de compte doit être soit une adresse NEAR valide (par exemple, .near ou adresse implicite), soit une adresse EVM valide.",
        account_check_errors: {
          invalid_account: "Compte invalide",
          invalid_account_format: "Format de compte invalide",
          invalid_account_length_long: "Longueur du compte invalide (trop long)",
          invalid_account_length_short: "Longueur du compte invalide (trop court)",
        },
        error_empty_amount: "Veuillez remplir le champ du montant",
        warning_address_non_standard:
          "L'adresse que vous envoyez est un suffixe {network} non standard ({accountSuffix})",
        sending_bridged_token_alert:
          "Il s'agit d'un jeton ponté. Ne l'envoyez pas sur des plateformes d'échange comme Binance.",
        account_no_exists_warning: "Le compte n'existe pas encore",
        named_account_no_exists_warning:
          "L'envoi à un compte nommé qui n'existe pas encore échouera probablement",
        account_no_exists_warning_deposit:
          "Le compte n'existe pas encore - il sera créé automatiquement sur ce dépôt",
        sending: "Envoi en cours",
        to: "à",
        account_exists: "Le compte existe",
        send: "envoyer",
        confirm_send: "Confirmer l'envoi",
        finish: "Finir",
        txID: "identifiant de transaction",
        sendFtSuccess: "Envoi FT réussi",
        sendSuccess: "Envoi réussi",
        mode_not_support: "mode non supporté",
        receiver_balance: "Le compte a actuellement un solde de {balance} {symbol}",
        receiver_balance_fail: "Impossible d'obtenir le solde",
        input_error_ft: "Les {label} ne sont pas transférables",
      },
      importWallet: {
        heading_confirmAccount: "importer votre compte",
        blurb_confirmAccount: "Sélectionnez le portefeuille que vous souhaitez importer",
        heading_inputPhraseSection: "Langue secrète",
        blurb_inputPhraseSection:
          "Fournissez la phrase de récupération secrète du portefeuille pour importer le portefeuille",
        heading_chooseInputType: "Comment souhaitez-vous importer votre portefeuille ?",
        heading_passwordSection: "portefeuille d'importation",
        heading_inputPrivateKeySection: "Clé privée",
        blurb_inputPrivateKeySection:
          "Fournir la clé privée du portefeuille pour importer le ,portefeuille",
        blurb_passwordSection:
          "L'importation d'un portefeuille nécessite un mot de passe de ,portefeuille",
        toast_title_noAccountFound: "Compte non trouvé",
        toast_text_noAccountFound:
          "Impossible de trouver un compte associé à cette phrase de départ secrète",
        toast_title_unknownError: "la recherche a échoué",
        toast_text_unknownError:
          "Une erreur d'API s'est produite lors de la tentative de vérification du compte. Vérifiez la phrase et réessayez.",
        toast_text_invalidKey: "Clé non valide. Veuillez vérifier votre saisie et réessayer.",
        a_12_word_secret: "Une phrase secrète de 12 mots",
        secret_phrase: "Phrase secrète",
        private_key: "Clé privée",
        private_key_desc: "Une clé privée de compte",
        hardware: "Ledger",
        hardware_desc: "Un portefeuille matériel",
        words_12: "12 mots",
        private_crypto_key: "Clé cryptographique privée",
        find_my_account: "Trouver mon compte",
        account: "Compte",
        already_imported: "Déjà importé",
        text_approve_ledger: "Approuver sur le périphérique Ledger",
        dont_see_wallet: "Vous ne trouvez pas votre compte ?",
        manual_import_here: "Importez-le manuellement.",
      },
      manualImport: {
        manual_import_account: "Importation manuelle de compte",
        import: "Importer le compte",
        insert_your_account_id:
          "Insérez votre identifiant de compte ici pour importer votre compte",
        incorrect_account_id:
          "Format de l'identifiant de compte invalide, doit appartenir à un compte racine tel que .near, .tg ou .sweat",
        account_not_exist_or_not_match:
          "Le compte n'existe pas ou la clé d'accès ne correspond pas",
        account_info_network_error:
          "Un problème est survenu lors de l'obtention des informations du compte. Veuillez réessayer plus tard",
        account_found_and_import: "Compte trouvé, vous pouvez maintenant importer le compte",
        close: "Fermer",
      },
      importWalletHardware: {
        title: "Portefeuille matériel",
        subtitle: "Spécifiez un chemin HD pour importer ses comptes liés.",
        toast_title_noAccountFound: "Aucun compte trouvé",
        toast_text_noAccountFound: "Impossible de trouver un compte lié à ce chemin HD",
      },
      createWalletHardware: {
        title: "Portefeuille matériel",
        subtitle: "Spécifiez un chemin HD pour créer un portefeuille",
        button_confirm: "Créer un nouveau portefeuille",
        toast_title_noAccountFound: "Le compte existe",
        toast_text_noAccountFound: "Un compte existe déjà sur ce chemin HD",
      },
      signTx: {
        receiving_from_dapp: "Recevoir des détails de Dapp",
        couldnt_parse_arg_login: "Impossible d'analyser les arguments corrects pour la connexion",
        couldnt_parse_arg_logout:
          "Impossible d'analyser les arguments corrects pour la déconnexion",
        connect_request: "Demande de connexion",
        connect_with_acc: "Connectez-vous avec le compte",
        this_app_would_like_to: "Cette application aimerait",
        know_your_add: "Connaître l'adresse de votre portefeuille",
        know_your_balance: "Connaître le solde de votre compte",
        network_fee_placeholder:
          "L'application sera autorisée à dépenser jusqu'à 0,25 NEAR pour les frais de réseau (gaz) encourus lors de l'utilisation.",
        network_fee_allowance: "Allocation de frais de réseau",
        something_went_wrong: "Quelque chose s'est mal passé",
        create_import_wallet: "Créer ou importer un nouveau portefeuille",
        contract: "Contracter",
        connect: "Relier",
        cancel: "Annuler",
        request_logout_could_not_found: "Le compte demandé pour la déconnexion est introuvable",
        sign_out_request: "Demande de déconnexion",
        sign_out_desc: "Vous avez demandé la résiliation d'un contrat",
        wallet: "Porte monnaie",
        logout: "Se déconnecter",
        couldnt_parse_arg_verify:
          "Impossible d'analyser les arguments corrects pour l'authentification",
        request_authentication_not_found:
          "Le compte demandé pour l'authentification est introuvable",
        verification_request: "Demande de vérification",
        verification_request_desc:
          "Vérifiez votre identité uniquement sur les sites auxquels vous faites confiance",
        verify_account: "Vérifier avec le compte",
        select_account: "Sélectionnez un compte",
        know_your_chosen_wallet_add: "Connaître l'adresse de votre portefeuille choisi",
        verify_own_wallet_add: "Vérifiez que vous possédez cette adresse de portefeuille",
        does_not_allow: "Cela ne permet pas",
        calling_method_on_behalf: "Méthodes d'appel ou signature de transactions en votre nom",
        verify: "Vérifier",
        estimated_changes: "Changements estimés",
        send: "Envoyer",
        you_sending_asset: "Vous envoyez cet élément",
        you_sending_assets: "Vous envoyez ces éléments",
        couldnt_parse_arg_tx:
          "Impossible d'analyser les arguments corrects pour signer la transaction",
        approve_transactions: "Approuver les transactions",
        approve_transaction: "Approuver la transaction",
        transaction: "Transaction",
        approve: "Approuver",
        close_details: "Fermer les détails",
        view_transaction_details: "Afficher les détails de la transaction",
        transaction_details: "détails de la transaction",
        fees_tooltips:
          'Aussi connu sous le nom de "gaz" - des frais de traitement du réseau pour cette transaction',
        fees_assurance:
          "Les frais réels sont souvent de 90 à 95 % inférieurs à l'estimation et le montant restant sera remboursé",
        fees: "Frais",
        with_deposit: "Avec dépôt",
        from: "De",
        to: "À",
      },
      explore: {
        text_explore: "Explorer",
        text_challenges: "Défis",
        text_missions: "Missions",
        text_rewards: "Récompenses",
        trending_projects: "Projets tendances",
        defi: " DeFi",
        nfts: " NFTs",
        near_ecosystem: " Ecosystème NEAR",
        hide: "cacher",
        show: "Afficher",
        tonic_desc:
          "Plateforme de trading hautement performante et entièrement décentralisée sur NEAR.",
        spin_desc:
          "Premier carnet de commandes en chaîne DEX sur NEAR avec une expérience de type CEX.",
        burrow_desc: "Fournir et emprunter des actifs portant intérêt sur le protocole NEAR.",
        perk_desc:
          "Agrégateur de liquidités pour NEAR avec une gamme complète de jetons et de routage.",
        pembrock_desc: "Première plateforme d'agriculture à effet de levier sur NEAR.",
        meta_yield_desc:
          "Une plateforme de levée de fonds qui permet à tout porteur de $NEAR de soutenir des projets.",
        paras_desc: "Marché social tout-en-un pour créateurs et collectionneurs",
        tradeport_desc:
          "Plateforme de trading inter-chaînes regroupant les NFT des places de marché",
        antisocial_desc:
          "Notre propre $GEAR a cours légal sur les tombolas d'Antisocial Labs. Étape 1 : Échangez $GEAR via Meteor ou gagnez-le avec Tinkers. Étape 2 : Gagnez des NFT ",
        near_social_desc: "Un protocole de données sociales pour NEAR",
        near_crash_desc: "Essayez et encaissez avant le crash !",
        challenge: {
          btn_view_details: "Voir les détails",
          btn_view_winners: "Voir les gagnants",
          btn_accept_challenge: "Accepter le défi",
          btn_challenge_accepted: "Défi accepté",
          status: {
            [EChallengeStatus.COMING_SOON]: "Bientôt disponible",
            [EChallengeStatus.ACTIVE]: "Actif",
            [EChallengeStatus.ENDED_WITHOUT_WINNERS]: "Terminé",
            [EChallengeStatus.ENDED_WITH_WINNERS]: "Terminé",
            [EChallengeStatus.WINNERS_TO_BE_ANNOUNCED]: "Les gagnants seront annoncés",
          },
        },
        mission: {
          label_my_profile: "Mon profil",
          label_level: "Niveau",
          label_points_earned: "Points gagnés",
          label_global_ranking: "Classement mondial",
          text_mission_unlock: "missions terminées pour débloquer le niveau suivant",
          label_daily_tasks: "Tâches quotidiennes",
          label_daily_task: "Tâche quotidienne",
          label_points_reward: "points en récompense",
          label_earn_more_side_quest: "Quêtes annexes",
          label_completed: "Terminé",
          label_earned: "gagné",
          button_start_now: "Commencer maintenant",
          user_consent: {
            label_title: "Plongez dans les missions Meteor !",
            label_description:
              "Relevez des défis passionnants, accumulez des points et échangez-les contre des récompenses exceptionnelles.",
            button_accept: "Oui, attaquons les missions !",
            text_note:
              "Merci de rejoindre Meteor Missions ! Veuillez patienter pendant que nous configurons votre compte (+-15 secondes).",
          },
          no_daily_task:
            "Tout est prêt pour aujourd'hui ! Revenez demain pour continuer votre série quotidienne.",
          no_side_quest:
            "Vous avez terminé toutes les quêtes ! Restez à l'écoute pour de nouveaux défis à venir bientôt.",
        },
        reward: {
          label_collected_points: "Points collectés",
          label_redeem: "Échanger",
          label_redeem_history: "Récupérer l'historique",
          label_claim_reward: "Réclamer la récompense",
          label_left: "gauche",
          button_redeem: "Échanger",
          button_harvest: "Récolter",
          button_claim: "Réclamer",
          no_redeem_title: "Pas de récompenses disponibles",
          no_redeem_description: "Il n'y a pas d'offres disponibles pour le moment.",
          no_claim_reward_title: "Pas de récompenses disponibles",
          no_claim_reward_description:
            "Vous n'avez aucune récompense à réclamer. Continuez à participer aux missions pour gagner des points et les échanger contre des récompenses !",
        },
      },
      meteorCard: {
        home: {
          subtitle:
            "Rejoignez la communauté Meteor en vous inscrivant tôt pour notre carte exclusive DeFi Mastercard. Soyez parmi les premiers à profiter de dépenses cryptographiques transparentes avec notre prochaine carte.",
          early_access_end: "L'offre d'avantages d'accès anticipé se termine dans",
          view_perks: "Voir les avantages",
          apply_now: "Postuler maintenant",
        },
        perkModal: {
          title1: "Accès anticipé",
          title2: "Avantages",
          item_title1: "Acompte entièrement remboursable",
          item_subtitle1:
            "Pesan tempat Anda sekarang hanya dengan $5 USDC—dapat dikembalikan sepenuhnya, tanpa risiko!",
          item_title2: "Frais promotionnels",
          item_subtitle2:
            "Penawaran Akses Awal: Dapatkan tempat Anda hanya dengan $5 USDC! (Bernilai $19,99)",
          item_title3: "Récompense exclusive",
          item_subtitle3:
            "Dapatkan Kontrak Ahli di Harvest Moon dan tingkatkan kemajuan Anda untuk memenuhi syarat mendapatkan airdrop Meteor.",
        },
        signup: {
          title: "Inscrivez-vous maintenant",
          subtitle: "Remplissez le formulaire ci-dessous pour obtenir un accès anticipé :",
          email: "Adresse e-mail",
          country: "Pays",
          country_placeholder: "Sélectionnez un pays",
          estimate_usage:
            "À quelle fréquence utiliseriez-vous votre carte Meteor Mastercard chaque mois ?",
          early_access_perks: "Avantages de l'accès anticipé",
          button_proceed: "Procéder au paiement",
          end_in: "Fin dans",
          error_registered: "Vous êtes déjà inscrit",
          error_signup_status_not_ready:
            "La demande d'inscription n'est actuellement pas prête (statut : {status}). Veuillez réessayer plus tard",
        },
        myApplication: {
          application_applied: "Application appliquée",
          title: "Ma candidature",
          subtitle: "Nous vous contacterons bientôt avec les détails du lancement.",
          wallet_id: "Identifiant du portefeuille",
          email: "Adresse e-mail",
          country: "pays",
          country_placeholder: "Sélectionnez un pays",
          cancel: "Annuler la candidature",
          update: "Mettre à jour",
          error_cancel_status_not_ready:
            "La demande d'annulation n'est actuellement pas prête (statut : {status}). Veuillez réessayer dans quelques minutes",
        },
        insufficientBalance: {
          title: "Solde insuffisant",
          subtitle:
            "Un dépôt de 5 $ en USDC est requis pour activer votre demande d'accès anticipé. Si vous décidez de ne pas prendre la carte, vous pouvez annuler dans les 7 jours et récupérer votre dépôt.",
          back: "Retour au portefeuille",
          topup: "Recharger USDC",
        },
        estimateUsageOption: {
          [EMeteorCardEstimateUsage.below_250]: "Utilisation légère (jusqu'à 250 $)",
          [EMeteorCardEstimateUsage.from_250_to_1000]: "Utilisation modérée (jusqu'à 1 000 $)",
          [EMeteorCardEstimateUsage.above_1000]: "Utilisation intensive (1 000 $ et plus)",
        },
      },
      appSettings: {
        heading_settings: "paramètres du portefeuille",
        button_language: "Langue",
        button_addressBook: "carnet d'adresses",
        button_subtext_addressBook: "Adresse commune",
        button_autoLockTimer: "Minuterie de verrouillage automatique",
        button_subtext_autoLockTimer:
          "Durée de la minuterie de verrouillage automatique du ,portefeuille",
        button_changePassword: "changer le mot de passe",
        button_subtext_changePassword: "Modifier votre code de déverrouillage",
        button_aboutMeteor: "À propos de Météore",
        button_subtext_aboutMeteor: "Nos contacts et informations sur la communauté",
        button_meteorCommunity: "Communauté météore",
        button_subtext_meteorCommunity: "Venez nous rejoindre",
        sectionConnectedApp: {
          text_deauthorize: "annuler l'autorisation",
          text_gasFeeAllowance: "Indemnité de dépenses",
          text_allowedMethod: "Méthodes autorisées",
          text_any: "tout",
        },
        sectionProfile: {
          update_profile_warning:
            "La première mise à jour du profil sera jusqu'à 0,04 NEAR en tant que frais de dépôt de stockage",
          update_pfp_warning:
            "Le PFP fixé pour la première fois associera jusqu'à 0,04 NEAR comme frais de dépôt de stockage.",
          pfp_updated: "PFP mis à jour.",
          profile_updated: "Profil mis à jour.",
          name: "Nom",
          about: "À propos de",
          update: "Mise à jour",
          set_pfp: "Définir le PFP",
          pfp_tooltip: "Le PFP doit être défini sur la page NFT",
          sync_near_social: "Utilisez ce profil dans l'écosystème NEAR avec Near Social.",
          sync_near_social_header: "Synchroniser avec NEAR Social",
          sync_near_social_desc:
            "La première synchronisation avec NEAR Social associera jusqu'à 0,04 NEAR en tant que frais de dépôt de stockage.",
          sync_now: "Synchroniser maintenant",
          account_synced: "Votre compte est synchronisé avec NEAR Social",
          follower: "Suiveur",
        },
        sectionDeleteAccount: {
          text_warning: "prévenir",
          text_delete_password:
            "Assurez-vous d'avoir sauvegardé votre méthode de récupération ou vous pourriez perdre l'accès à votre compte",
          text_action_desc: "Cette action supprimera les comptes suivants de votre portefeuille :",
          text_remove_account: "Retirer du portefeuille Meteor",
        },
        sectionChangePassword: {
          text_password_changed_success: "Réinitialisation du mot de passe terminée",
          text_change_password_warning:
            "Cela changera le mot de passe de connexion pour l'ensemble du portefeuille (tous les comptes)",
          text_finish: "Finir",
          text_change_password: "changer le mot de passe",
          text_create_password: "créer un nouveau mot de passe",
        },
        sectionCommunity: {
          text_thank_you: "Merci d'avoir choisi Meteor Wallet !",
          text_follow_twitter: "Suivre sur Twitter",
          text_report_bug: "Signaler des bugs logiciels",
          text_join_discord: "Rejoindre Discord",
          text_communityBlurb:
            "Nous serions ravis que vous fassiez partie de notre communauté grandissante et que vous nous fassiez part de vos réflexions sur ce que nous pouvons faire pour nous améliorer.",
        },
        sectionAccessKey: {
          text_add_key: "Ajouter une nouvelle clé d'accès",
          text_edit_label: "modifier l'étiquette",
          text_revoke_access: "accès révoqué",
          text_revoke_access_key: "révoquer la clé d'accès",
          text_remove_key_desc:
            "Êtes-vous sûr de vouloir supprimer cette clé d'accès de votre compte Near ?",
          text_remove_key: "supprimer la clé",
          text_cancel: "Annuler",
          text_primary_key: "Clé primaire de météore",
          text_hardware_key: "Clé matérielle",
          text_hardware_ledger_key: "Clé Ledger",
          text_hd_path: "Chemin HD",
          text_public_key: "Clé publique",
          text_known_data: "données connues",
          text_private_key: "Clé privée",
          text_secret_phrase: "Langue secrète",
          text_unknown_to_meteor: "inconnue",
          text_access_key_warning_msg:
            "Veuillez vous assurer que cette clé d'accès n'est pas liée à une ,méthode de récupération que vous souhaitez toujours utiliser ! Ils ne fonctionneront plus.",
          text_access_key: "clé d'accès",
          text_add_key_subtitle: "Générer ou ajouter une clé d'accès pour ce wallet",
          text_access_key_label: "Libellé de la clé d'accès",
          text_generate_new_key: "Générer une nouvelle clé",
          text_generate_new_key_desc:
            "Générer une nouvelle clé de récupération de phrase de départ pour ce portefeuille",
          text_clear_label: "Effacer l'étiquette",
        },
      },
      wallet: {
        max: "Max",
        heading_walletLocked: "portefeuille verrouillé",
        button_unlockWallet: "déverrouiller le portefeuille",
        blurb_walletLocked:
          "Ce portefeuille est actuellement verrouillé. Indiquez votre mot de passe ,pour le déverrouiller.",
        toast_heading_passwordIncorrect: "Le mot de passe est incorrect",
        toast_text_passwordIncorrect: "le déverrouillage du portefeuille a échoué",
        settings: {
          settings: "paramètres",
          heading_settings: "paramètres du portefeuille",
          input_heading_extractSecret: "Afficher les mots secrets",
          input_text_extractSecret: "Mot de passe pour retirer le portefeuille",
          input_heading_exportPrivateKey: "exporter la clé privée",
          input_heading_managePrivateKeys: "Gérer les clés d'accès complet",
          input_text_managePrivateKeys: "Affichez, signez et faites pivoter vos clés privées",
          input_text_exportPrivateKey: "Exporter la clé privée du portefeuille",
          input_heading_walletLabel: "étiquette de portefeuille",
          input_text_walletLabel: "Entrez une étiquette pour ce portefeuille",
          menu_heading_profile: "Profil",
          menu_text_profile: "Gérer votre profil",
          menu_heading_connectedApps: "applications connectées",
          menu_text_connectedApps: "Gérer l'accès des applications à votre portefeuille",
          menu_heading_securityAndRecovery: "sécurité et récupération",
          menu_text_securityAndRecovery:
            "Gérez les mots de passe et les clés privées de votre ,portefeuille",
          menu_heading_changePassword: "changer le mot de passe",
          menu_text_changePassword:
            "Modifier le mot de passe utilisé pour déverrouiller le portefeuille",
          menu_heading_RemoveWalletAccount: "Supprimer le compte",
          menu_text_removeWalletAccount: "Supprimer ce compte de votre portefeuille",
          common: {
            account_not_created_secret_note_1:
              "Ce compte n'a pas été créé ou importé (à l'aide de Secret Phrase) via Meteor Wallet, donc aucune phrase secrète cryptée n'est actuellement disponible",
            account_not_created_secret_note_2:
              "Rassurez-vous, votre phrase secrète d'origine devrait toujours fonctionner comme méthode de récupération si vous ne l'avez pas supprimée de votre compte Near",
            account_not_created_secret_note_3:
              "La fonctionnalité permettant de faire pivoter votre phrase secrète dans Meteor Wallet est en préparation !",
            enterPasswordBlurb: "mot de passe du portefeuille requis",
            enterPasswordCreateWalletBlurb:
              "L'ajout d'un nouveau portefeuille nécessite un mot de passe de portefeuille",
          },
          exportPrivateKey: {
            text_subheadingWarning:
              "Soyez très prudent lorsque vous stockez ou partagez cette clé. Toute personne y ayant accès peut reprendre ce compte portefeuille.",
            text_copiedToClipboard: "Clé privée copiée",
          },
          manageAccessKeys: {
            input_text_accessKeyLabel: "Saisissez un libellé pour cette clé d'accès",
            button_updateLabel: "mettre à jour l'étiquette",
          },
        },
      },
      signIn: {
        welcome: "Bienvenu ",
        blurb: "Le web décentralisé vous attend...",
        button_unlock: "ouvrir",
        input_header_password: "déverrouiller avec mot de passe",
        text_forgot_password: "mot de passe oublié?",
        toast_heading_passwordIncorrect: "Le mot de passe est incorrect",
        toast_text_passwordIncorrect: "Impossible de se connecter à votre profil",
      },
      addWallet: {
        blurb: "Choisissez comment vous souhaitez configurer votre portefeuille",
        heading_meteorWallet: "Portefeuille météore",
        button_import_wallet: "portefeuille d'importation",
        button_subtext_import_wallet:
          "Importez votre portefeuille existant avec une phrase de départ de 12 mots",
        button_create_new_wallet: "créer un nouveau portefeuille",
        button_subtext_create_new_wallet:
          "Cela créera un nouveau portefeuille et une phrase de départ",
        text_named_wallet: "nom de portefeuille",
        text_named_wallet_desc: "Un nom personnalisé de votre choix",
        text_unavailable: "indisponible",
      },
      createNewWallet: {
        heading_newWallet: "Nouveau portefeuille",
        please_insert_password:
          "Mot de passe du portefeuille requis pour ajouter un nouveau portefeuille",
        p4_please_try_again: "Veuillez réessayer",
        p4_unforunately_something_went_wrong:
          "Malheureusement, quelque chose s'est mal passé et nous ne sommes pas en mesure de financer la création de votre portefeuille. Vous pouvez créer un portefeuille implicite et financer la création du portefeuille pour le moment.",
        heading_newWalletChoice: "Le choix t'appartient",
        subheading_newWalletChoice: "Quel type de portefeuille aimeriez-vous créer ?",
        requires_initial_balance:
          "Nécessite un solde initial de 0,1 NEAR pour ouvrir, financé à partir d'un portefeuille précédemment connecté",
        random_64_character: "Un identifiant aléatoire de 64 caractères",
        next: "Prochain",
        traditional_crypto_wallet: "Portefeuille crypto traditionnel",
        new_wallet: "Nouveau portefeuille",
        available_near: "Disponible PRÈS",
        available_fund: "Disponible pour financement",
        initial_wallet_balance: "Solde initial du portefeuille",
        initial_wallet_balance_named_wallet:
          "Au moins 0,1 NEAR est requis comme solde initial lors de la création d'un portefeuille nommé personnalisé",
        select_funding_wallet: "Sélectionnez le portefeuille de financement",
        no_account_selected: "Aucun compte sélectionné",
        account_not_exist: "Le compte n'existe pas",
        not_enough_funds: "Pas assez de fonds sur le compte",
        initial_funding_amount: "Montant du financement initial",
        account_identity: "Identité de votre compte",
        account_identity_desc: "Quelle serait votre adresse de portefeuille Near personnalisée ?",
        is_available: "est disponible",
        username_is_available: "Félicitation. Votre nom d'utilisateur est valide",
        account_already_exists: "Le nom du compte existe déjà",
        account_not_compatible: "Le nom de compte n'est pas compatible",
        account_can_contain: "Votre ID de compte peut contenir l'un des éléments suivants",
        lowercase_characters: "Caractères minuscules",
        digits: "Chiffres",
        character_requirement: "Les caractères (_-) peuvent être utilisés comme séparateurs",
        account_cannot_contain: "Votre identifiant de compte NE PEUT PAS contenir",
        character_dot: 'Caractères "@" ou "."',
        more_than_64_characters: "Plus de 64 caractères (y compris .",
        fewer_than_2_characters: "Moins de 2 caractères",
        explore_web3: "Explorer le Web3",
        step_into_future: "Entrez dans le futur avec Meteor",
        generateNew: "générer de nouveaux",
        claimIdentity: "Revendiquez votre identité",
        button_create_with_ledger: "Créer avec Ledger",
        extensionCreate: {
          title: "Création de portefeuille désactivée",
          description:
            "La création de compte est temporairement désactivée sur l'extension. Veuillez créer votre portefeuille dans le portefeuille web, puis l'importer dans l'extension.",
          button_import: "Importer un portefeuille existant",
          button_open_web_wallet: "Ouvrir le portefeuille sur le Web",
        },
      },
      gettingStarted: {
        button_getStarted: "début",
        welcomeToMeteor: "Bienvenue chez Météore",
        blurb:
          "Stockez et implantez en toute sécurité vos jetons NEAR et vos actifs compatibles avec Meteor.",
      },
      createPassword: {
        buttons: {
          continue: "Continuez",
        },
        agreeToTerms: (link) => (
          <>
            Je suis d'accord{" "}
            <Link colorScheme={"brandPrimary"} fontWeight={600} href={link} isExternal>
              Conditions d'utilisation
            </Link>
          </>
        ),
        heading: "créer un mot de passe",
        blurb: "texte de présentation",
        placeholders: {
          enterPassword: "Entrer le mot de passe",
          confirmPassword: "Confirmez le mot de passe",
        },
        validation: {
          atLeast8: "au moins 8 caractères",
          doNotMatch: "Les mots de passe ne correspondent pas",
          strengthTooWeak: "trop faible",
          strengthWeak: "faible",
          strengthMedium: "moyen",
          strengthStrong: "puissant",
        },
      },
      recoveryPhrase: {
        heading: "mnémonique secret",
        blurb:
          "Enregistrez ces 12 mots dans un gestionnaire de mots de passe ou écrivez-les et stockez-les dans un endroit sûr. Ne partagez avec personne",
        confirmSavedPhrase: "J'ai enregistré ma phrase de départ secrète",
        buttons: {
          continue: "Continuez",
          copy: "copie",
          generateNew: "générer de nouveaux",
        },
        toasts: {
          copiedToClipboard: "copié dans le presse-papier",
        },
      },
      seedPhraseConfirmation: {
        buttons: {
          confirm: "confirmer",
        },
        wordForFirst: "Première",
        wordForLast: "le dernier",
        heading: "L'avez-vous sauvegardé ?",
        blurb:
          "Vérifiez que vous avez enregistré votre mnémonique en cliquant sur le premier (1) et le dernier (12) mots.",
        confirmationWrongHeading: "phrase de récupération mot incorrect",
        confirmationWrongBlurb:
          "Assurez-vous d'avoir enregistré cette phrase dans un endroit sûr et de pouvoir la rappeler en cas de besoin",
        profilePasswordMismatchHeading: "mauvais mot de passe",
        profilePasswordMismatchBlurb:
          "Le mot de passe du profil actuel ne correspond pas au mot de ,passe fourni",
      },
      accountSuccess: {
        heading: "Finir!",
        blurb:
          "Faites attention aux mises à jour du produit, si vous avez des questions, veuillez nous contacter",
        followUsOnTwitter: "Suivez-nous sur Twitter",
        joinDiscord: "Obtenir de l'aide sur Discord",
        button_finish: "Finir",
        button_redirect: "Visitez l'URL de redirection",
        toast_title: "Créer un compte avec succès",
        toast_title_with_redirect:
          "Compte créé avec succès, vous serez redirigé vers l'application sous peu.",
        toast_redirect_whitelisted_failed:
          "Ce lien de redirection n'a pas été approuvé pour la redirection",
      },
      transactions: {
        heading_history: "l'histoire",
        badgeStatus: {
          [ETransactionBadgeStatus.SUCCEED]: "Succès",
          [ETransactionBadgeStatus.FAILED]: "manqué",
          [ETransactionBadgeStatus.LOADING]: "Chargement",
          [ETransactionBadgeStatus.PROCESSING]: "Traitement",
          [ETransactionBadgeStatus.WAITING]: "Attendre",
          [ETransactionBadgeStatus.UNKNOWN]: "inconnue",
        },
        common: {
          call: "CALL",
          status: {
            success: "Succès",
            failed: "manqué",
            unknown: "autre",
          },
        },
        loadingBottom: {
          more: "charger plus",
          loading: "Chargement",
          end: "rien ici",
          endTransaction90Days: "Plus aucune transaction au cours des 90 derniers jours",
        },
        typeName: {
          receive: "Reçu",
          send: "A été envoyé",
          self: "auto-invoqué",
          unknown: "autre",
        },
        direction: {
          from: "de",
          to: "à",
          with: "et",
        },

        accessKey: {
          addKey: "{key} a été ajouté.",
          deleteKey: "Une {clé} a été supprimée.",
          key: "clé",
          permissionTypes: {
            [ENearIndexer_AccessKeyPermission.FULL_ACCESS]: "clé d'accès complet",
            [ENearIndexer_AccessKeyPermission.FUNCTION_CALL]: "touche d'appel de fonction",
          },
          publicKey: "Clé publique",
          receiverId: "Contrat d'autorisation",
          allowMethodNames: "méthode autorisée",
          emptyMethodNames: "De toute façon",
          allowance: "Montant de l'allocation",
        },

        account: {
          createTitle: "créer un compte",
          createdMessage: "Compte {account_id} créé.",
          deletedMessage: "Le compte {account_id} a été supprimé.",
          byId: "par compte",
          deposit: "verser:",
          beneficiaryId: "transfert de solde vers",
        },

        deploy: {
          code: "le code",
          message: "Vous avez déployé {code} sur {contract}.",
        },

        functionCall: {
          brief: "Appelé {method_name} chez {receiver}",
          details: "La méthode {method_name} a été appelée sur le contrat {receiver}.",
          cost: "Limite de gaz :",
          deposit: "verser:",
          args: "Args:",
        },

        details: {
          transactionHash: "hachage de transaction",
          includedInBlockHash: "bloquer le hachage",
          includedInChunkHash: "bloquer le hachage",
          blockTimestamp: "Heure de signature",
          signerAccountId: "signataire",
          signerPublicKey: "Clé publique",
          receiverAccountId: "destinataire",
          convertedIntoReceiptId: "Reçu",
          receiptConversionBurnt: "Brûlure de gaz et de jetons",
          moreInformation: "Plus d'information",
          lessInformation: "moins d'informations",
          action: "action",
          viewExplorer: "afficher sur le navigateur",
        },

        custom: {
          ftSwap: {
            title: "Échange FT",
            near: "Proche échange",
          },
          nftTrade: {
            direction: {
              [ENftOfferDir.TO_YOU]: "Te donner",
              [ENftOfferDir.FROM_YOU]: "de toi",
            },
          },
        },
      },
      nftCollection: {
        heading_nft: "ma collection",
        nothing: "Vous ne possédez pas encore NFT.",
        total_nfts: "NFT totaux",
        total_floor_price: "Prix plancher total",
        total_floor: "Étage total",
        floor_price: "Prix plancher",
        contract: "Contrat",
      },
      nftDetails: {
        button_send: "envoyer",
        button_explorer: "navigateur",
        button_view: "Vérifier",
        heading_description: "décris",
        heading_properties: "caractéristique",
      },
      execution: {
        step: "Étape",
        of: "de",
        transaction_hash: "Hash de transaction",
        button_finish: "Terminer",
        title: "Exécution de la transaction",
        checking: "Vérification",
        transaction_execution_status: {
          [ETransactionExecutionStatus.awaiting_signer]: "En attente du signataire",
          [ETransactionExecutionStatus.failed]: "Échec",
          [ETransactionExecutionStatus.pending_signing]: "Signature en attente",
          [ETransactionExecutionStatus.publishing]: "Publication",
          [ETransactionExecutionStatus.signed]: "Signé",
          [ETransactionExecutionStatus.success]: "Succès",
        },
      },
      ledger: {
        title: "Appareil Ledger",
        connected: "Connecté",
        button_try_again: "Réessayer",
        ledger_device_alert: {
          [ELedgerConnectionStatus.connected]: {},
          [ELedgerConnectionStatus.disconnected]: {},
        },
        functionality_not_supported:
          "Cette fonction n'est pas encore prise en charge sur les appareils Ledger.",
      },
    },
  } as DeepPartial<ITranslations>,
  translation_en,
);
