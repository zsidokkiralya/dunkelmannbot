const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply, safeReply } = require("../utils/embedBuilder");

const LABELS = {
  CreateInstantInvite: "Meghívó létrehozása", KickMembers: "Tagok kirúgása",
  BanMembers: "Tagok kitiltása", Administrator: "Adminisztrátor",
  ManageChannels: "Csatornák kezelése", ManageGuild: "Szerver kezelése",
  AddReactions: "Reakciók hozzáadása", ViewAuditLog: "Auditnapló megtekintése",
  PrioritySpeaker: "Elsőbbségi beszélő", Stream: "Élő közvetítés",
  ViewChannel: "Csatorna megtekintése", SendMessages: "Üzenetek küldése",
  SendTTSMessages: "TTS-üzenetek küldése", ManageMessages: "Üzenetek kezelése",
  EmbedLinks: "Beágyazott hivatkozások", AttachFiles: "Fájlok csatolása",
  ReadMessageHistory: "Üzenetelőzmények olvasása", MentionEveryone: "@everyone és rangok említése",
  UseExternalEmojis: "Külső emojik használata", ViewGuildInsights: "Szerverstatisztikák",
  Connect: "Csatlakozás hangcsatornához", Speak: "Beszéd",
  MuteMembers: "Tagok mikrofonjának némítása", DeafenMembers: "Tagok hallásának némítása",
  MoveMembers: "Tagok áthelyezése", UseVAD: "Hangaktiválás",
  ChangeNickname: "Saját becenév módosítása", ManageNicknames: "Becenevek kezelése",
  ManageRoles: "Rangok kezelése", ManageWebhooks: "Webhookok kezelése",
  ManageGuildExpressions: "Szerveremojik és matricák kezelése", UseApplicationCommands: "Alkalmazásparancsok",
  RequestToSpeak: "Szólás kérése", ManageEvents: "Események kezelése",
  ManageThreads: "Szálak kezelése", CreatePublicThreads: "Nyilvános szálak létrehozása",
  CreatePrivateThreads: "Privát szálak létrehozása", UseExternalStickers: "Külső matricák",
  SendMessagesInThreads: "Üzenetek küldése szálakban", UseEmbeddedActivities: "Aktivitások",
  ModerateMembers: "Tagok időkorlátos némítása", ViewCreatorMonetizationAnalytics: "Bevételi statisztikák",
  UseSoundboard: "Hangpanel használata", CreateGuildExpressions: "Emojik és matricák létrehozása",
  CreateEvents: "Események létrehozása", UseExternalSounds: "Külső hangok használata",
  SendVoiceMessages: "Hangüzenetek küldése", SendPolls: "Szavazások létrehozása",
  UseExternalApps: "Külső alkalmazások használata", PinMessages: "Üzenetek kitűzése",
  BypassSlowmode: "Lassított mód megkerülése",
};

function permissionRows(role) {
  const seen = new Set();
  return Object.entries(PermissionFlagsBits).filter(([, bit]) => {
    if (seen.has(bit.toString())) return false;
    seen.add(bit.toString());
    return true;
  }).map(([name, bit]) => `${role.permissions.has(bit) ? "✅" : "❌"} ${LABELS[name] || name} (\`${name}\`)`);
}

module.exports = {
  guildOnly: true,
  data: new SlashCommandBuilder().setName("permscheck")
    .setDescription("Kiírja egy rang összes szerverjogosultságát")
    .addRoleOption((option) => option.setName("role").setDescription("Az ellenőrizendő rang").setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole("role");
    if (!interaction.guild || !role || role.guild.id !== interaction.guild.id)
      return safeReply(interaction, cv2Reply({ description: "❌ Válassz egy rangot erről a szerverről." }, true));
    const admin = role.permissions.has(PermissionFlagsBits.Administrator);
    const header = `**Rang:** ${role} (\`${role.id}\`)\n**Adminisztrátor:** ${admin ? "igen" : "nem"}\n` +
      "A rang szerverjogait mutatom, nem egy tag összes rangját. " +
      (admin ? "Az adminjog felülírja a csatornatiltásokat, a rangsorrendet nem." :
        "A csatornafelülírások ezeket csatornánként módosíthatják.");
    const pages = [header + "\n\n"];
    for (const row of permissionRows(role)) {
      if (pages[pages.length - 1].length + row.length + 1 > 3300) pages.push("");
      pages[pages.length - 1] += row + "\n";
    }
    for (let page = 0; page < pages.length; page++) {
      await safeReply(interaction, cv2Reply({
        title: "🔎 Rangjogosultságok", description: pages[page],
        footer: pages.length > 1 ? `Dunkelmann • ${page + 1}/${pages.length}` : "Dunkelmann",
      }));
    }
  },
  permissionRows,
};
