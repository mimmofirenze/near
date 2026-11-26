import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFCF4",
  },

  container: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
  },

  logo: {
    width: 130,
    height: 97,
    marginTop: 10,
  },

  title: {
      fontSize: 20,
      fontFamily: "alanSemiBold",
      marginBottom: 21,
      marginTop: 24,
      textAlign: "center",
  },

  input: {
      width: "70%",
      minHeight: 40,
      paddingVertical: 8,
      backgroundColor: "#D9D9D9",
      borderRadius: 11,
      paddingHorizontal: 18,
      marginBottom: 20,
      textAlign: "center",
      fontSize: 16,
      fontFamily: "alanRegular",
      color: "#111",
  },

passwordContainer: {
    width: "70%",
    minHeight: 40,
    backgroundColor: "#D9D9D9",
    borderRadius: 11,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
},

passwordInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingLeft: 30,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "alanRegular",
    color: "#111",
},

eyeButton: {
    alignSelf: "stretch",
    width: 45,
    alignItems: "center",
    justifyContent: "center",
},

inputError: {
  borderWidth: 1.5,
  borderColor: "#D92D20",
},

errorText: {
  width: "70%",
  color: "#D92D20",
  fontSize: 12,
  fontFamily: "alanRegular",
  textAlign: "center",
  marginTop: -14,
  marginBottom: 8,
},

continueButtonDisabled: {
  backgroundColor: "#76C6FF",
  opacity: 0.65,
},

continueButtonActive: {
  backgroundColor: "#44b1ff",
},

continueButton: {
    minWidth: 137,
    maxWidth: "90%",
    minHeight: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 33,
},

continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "alanRegular",
    textAlign: "center",
},

  dividerContainer: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 35,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#AFAFAF",
  },

dividerText: {
    marginHorizontal: 11,
    color: "#A0A0A0",
    fontSize: 16,
    fontFamily: "alanRegular",
    flexShrink: 1,
    textAlign: "center",
},

  socialBorder: {
    width: "80%",
    borderRadius: 10,
    padding: 2,
    marginBottom: 18,
  },

socialButton: {
    minHeight: 40,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFFCF4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
},

  socialIcon: {
    width: 25,
    height: 25,
  },

  socialButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "alanRegular",
  },

loginText: {
    fontSize: 14,
    fontFamily: "alanRegular",
    textAlign: "center",
    marginBottom: 30,
},

loginLink: {
    color: "#24A9E8",
    fontFamily: "alanSemiBold",
},
});