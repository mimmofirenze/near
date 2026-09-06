import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontFamily: "alanRegular",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 32,
  },

  section: {
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: "alanRegular",
    marginBottom: 12,
  },

  settingCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },

  settingRow: {
    minHeight: 86,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  settingInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  settingTextContainer: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    fontFamily: "alanRegular",
  },

  settingDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
    fontFamily: "alanRegular",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.18,
    marginLeft: 54,
  },

  logoutButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },

  logoutButtonPressed: {
    opacity: 0.65,
  },

  logoutButtonText: {
    fontSize: 16,
    fontFamily: "alanRegular",
  },
  
  themeRow: {
  minHeight: 60,
  paddingHorizontal: 16,
  paddingVertical: 12,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

});

