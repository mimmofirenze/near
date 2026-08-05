import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFCF4",
  },

  container: {
    flex: 1,
    alignItems: "center",
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
  },

  input: {
    width: "70%",
    height: 40,
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
  height: 40,
  backgroundColor: "#D9D9D9",
  borderRadius: 11,
  marginBottom: 20,
  flexDirection: "row",
  alignItems: "center",
},

passwordInput: {
  flex: 1,
  height: "100%",
  paddingLeft: 30,
  textAlign: "center",
  fontSize: 16,
  fontFamily: "alanRegular",
  color: "#111",
},

eyeButton: {
  height: "100%",
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
    width: 137,
    height: 40,
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
  },

  socialBorder: {
    width: "80%",
    borderRadius: 10,
    padding: 2,
    marginBottom: 18,
  },

  socialButton: {
    height: 40,
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
    fontSize: 16,
    fontFamily: "alanRegular",
    marginRight: 24,
  },

  loginButton: {
    width: "70%",
    height: 40,
    borderWidth: 2,
    borderColor: "#006EFF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },

  loginButtonText: {
    color: "#006EFF",
    fontSize: 16,
    fontFamily: "alanRegular",
  },
});