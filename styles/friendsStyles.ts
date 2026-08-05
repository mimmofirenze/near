import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 35,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 42,
    marginTop: 42,
  },

  searchContainer: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: "#DEDEDE",
    paddingHorizontal: 11,
  },

  searchIcon: {
    marginRight: 16,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#111111",
  },

  qrButton: {
    marginLeft: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  list: {
    paddingBottom: 30,
  },

  friendCard: {
    minHeight: 69,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DEDEDE",
    borderRadius: 11,
    marginBottom: 14,
    paddingHorizontal: 9,
    paddingVertical: 6,

    elevation: 4,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.22,
    shadowRadius: 3,
  },

  avatar: {
    width: 57,
    height: 57,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#222222",
  },

  friendInfo: {
    flex: 1,
    marginLeft: 10,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    fontSize: 16,
    color: "#111111",
  },

  flag: {
    marginLeft: 8,
    fontSize: 27,
  },

  username: {
    marginTop: 2,
    fontSize: 14,
    color: "#111111",
  },

  viewButton: {
    minWidth: 58,
    height: 29,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#FFFCF4",
    paddingHorizontal: 12,
  },

  viewButtonText: {
    fontSize: 15,
    color: "#111111",
  },

  addButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#FFFCF4",
  },

  pressed: {
    opacity: 0.55,
  },

  emptyText: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 16,
  },
});