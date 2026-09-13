import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "./client";

// ── Helpers ───────────────────────────────────────────────────────────────

/** Mapping des messages d'erreur bruts vers le français */
const errorMessages: Record<string, string> = {
  "User already exists.": "Un utilisateur avec cet email existe déjà.",
  "User already exists. Use another email.":
    "Un utilisateur avec cet email existe déjà. Veuillez utiliser une autre adresse email.",
  "Veuillez vérifier votre adresse email avant de vous connecter.":
    "Veuillez vérifier votre adresse email avant de vous connecter.",
  "Invalid email or password": "Email ou mot de passe invalide.",
  "Email not verified": "Veuillez vérifier votre adresse email.",
  "Phone number already exists": "Ce numéro de téléphone est déjà utilisé.",
};

/** Traduit un message d'erreur brut en français */
const translateErrorMessage = (message: string): string => {
  return errorMessages[message] || message;
};

// ── Types ─────────────────────────────────────────────────────────────────

/** Données d'inscription pour un compte partenaire */
export interface PartnershipRegisterUser {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  [key: string]: unknown;
}

// ── Callback options ──────────────────────────────────────────────────────

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

// ── useCreatePartnership ──────────────────────────────────────────────────

/** Crée un compte utilisateur partenaire */
export const useCreatePartnership = (options?: MutationCallbacks) => {
  const queryClient = useQueryClient();

  const {
    mutateAsync: createPartnership,
    isPending: isCreatingPartnership,
    isSuccess: isCreatingPartnershipSuccess,
    isError: isCreatingPartnershipError,
    error: errorCreatingPartnership,
  } = useMutation({
    mutationFn: async (data: PartnershipRegisterUser) => {
      const result = await getApiClient().api.v1.users.partnership.post(
        data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      );

      if (result.error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorValue = result.error.value as any;
        const errorMessage =
          errorValue?.error || // Backend structure
          errorValue?.message || // Eden structure
          (typeof errorValue === "string" ? errorValue : null) ||
          "Erreur lors de la création du compte partenaire";
        throw new Error(translateErrorMessage(errorMessage));
      }

      const responseData = result.data;
      if (!responseData?.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error(
          (responseData as any)?.error ||
            "Erreur lors de la création du compte",
        );
      }

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      options?.onSuccess?.();
    },
    onError: (erreur: Error) => {
      options?.onError?.(erreur.message);
    },
  });

  return {
    createPartnership,
    isCreatingPartnership,
    isCreatingPartnershipSuccess,
    isCreatingPartnershipError,
    errorCreatingPartnership,
  };
};
