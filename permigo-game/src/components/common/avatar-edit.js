// ═══════════════════════════════════════════════════════════════
// Avatar edit — flux unique « changer ma photo » (élève + moniteur).
//
// Ouvre le sélecteur (9 avatars + « Ma photo »), puis persiste le choix
// PARTOUT de façon cohérente, exactement comme la boutique :
//   • profiles.avatar_url (serveur) → classement, vues moniteur, multi-appareils
//   • setEquippedAsset("avatar")    → localStorage + user_preferences + header
//     (l'affichage suit `getEquippedAsset("avatar") || avatar_url`, donc les
//      deux doivent être à jour pour éviter qu'un ancien avatar équipé gagne).
//
// Usage :
//   import { changeAvatar } from "@/components/common/avatar-edit.js";
//   const url = await changeAvatar({ me, currentUrl });
//   if (url) { /* mets à jour ton écusson */ }
// ═══════════════════════════════════════════════════════════════
import { sb } from "@/auth/auth.js";
import { setEquippedAsset } from "@/utils/game-state.js";
import { openAvatarPicker } from "@/components/common/avatar-picker.js";

// Envoie une photo perso dans le bucket user-media, renvoie l'URL publique.
async function uploadPhoto(userId, file) {
  if (file.size > 5 * 1024 * 1024) {
    const { toast } = await import("@/components/common/toast.js");
    toast("Image trop grosse (max 5 Mo)", "error");
    return null;
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("user-media").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    const { toast } = await import("@/components/common/toast.js");
    toast("Échec de l'envoi : " + (error.message || ""), "error");
    return null;
  }
  const { data } = sb.storage.from("user-media").getPublicUrl(path);
  return data?.publicUrl || null;
}

// Persiste le nouvel avatar : DB (serveur) + asset équipé (header/local).
async function persistAvatar(userId, url) {
  const { error } = await sb
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (error) {
    const { toast } = await import("@/components/common/toast.js");
    toast("Photo non enregistrée — réessaie", "error");
    return false;
  }
  setEquippedAsset("avatar", url); // header + getEquippedAsset immédiats
  return true;
}

/**
 * Ouvre le sélecteur d'avatar et persiste le choix.
 * @param {{ me:{id:string}, currentUrl?:string|null }} opts
 * @returns {Promise<string|null>} nouvelle URL, ou null si annulé/échec
 */
export async function changeAvatar({ me, currentUrl = null }) {
  const choice = await openAvatarPicker({ currentUrl });
  if (!choice) return null;

  // Avatar par défaut (une des vignettes) → chaîne d'URL, persiste directement.
  if (typeof choice === "string") {
    return (await persistAvatar(me.id, choice)) ? choice : null;
  }

  // « Ma photo » → { file } : upload dans user-media puis persistance.
  const url = await uploadPhoto(me.id, choice.file);
  if (!url) return null;
  return (await persistAvatar(me.id, url)) ? url : null;
}
