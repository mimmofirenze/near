import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFCF4",
  },

  content: {
    alignItems: "center",
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

  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  button: {
    minWidth: 90,
    height: 31,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111111",
    borderRadius: 10,
    backgroundColor: "#FFFCF4",
  },

  buttonPressed: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: 14,
    color: "#111111",
    fontFamily: 'alanRegular',
  },

  profileImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    resizeMode: "cover",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  name: {
    fontSize: 25,
    fontFamily: 'alanRegular',
  },

  mainFlag: {
    fontSize: 24,
    marginLeft: 22,
  },

  username: {
  fontSize: 16,
  opacity: 0.65,
  marginTop: 4,
  marginBottom: 10,
  fontFamily: 'alanRegular',
  },

  bio: {
    marginTop: 25,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    color: "#111111",
    fontFamily: 'alanRegular',
  },

  locationSection: {
    alignItems: "center",
    marginTop: 30,
  },

  sectionTitle: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: 'alanRegular',
  },

  location: {
    marginTop: 17,
    fontSize: 16,
    fontFamily: 'alanRegular',
  },

  lastUpdate: {
    marginTop: 1,
    fontSize: 14,
    fontFamily: 'alanRegular',
  },

  countriesSection: {
    alignItems: "center",
    marginTop: 31,
  },

  flagsRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 10,
  width: "100%",
  justifyContent: "flex-start",
  alignItems: "flex-start",
},

  flagContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 9,
  },

  flag: {
    fontSize: 24,
  },

  memberSince: {
  marginTop: 30,
  alignSelf: "center",
  fontFamily: 'alanRegular',
  fontSize: 15,
},
});