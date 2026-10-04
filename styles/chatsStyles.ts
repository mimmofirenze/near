import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: "center",
  },

  title: {
    fontFamily: "alanRegular",
    fontSize: 28,
    textAlign: "center",
  },

  errorText: {
    paddingHorizontal: 22,
    marginBottom: 10,
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
    gap: 10,
  },

  emptyTitle: {
    fontFamily: "alanRegular",
    fontSize: 19,
  },

  emptySubtitle: {
    color: "#888888",
    fontFamily: "alanRegular",
    textAlign: "center",
  },

  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 13,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 14,
  },

  chatInfo: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontFamily: "alanRegular",
    fontSize: 18,
  },

  lastMessage: {
    marginTop: 4,
    fontFamily: "alanRegular",
    fontSize: 14,
  },

  rightSection: {
    marginLeft: 10,
    alignItems: "flex-end",
    gap: 7,
  },

  time: {
    fontSize: 12,
    fontFamily: "alanRegular",
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  nameRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

flag: {
  fontSize: 18,
},
});