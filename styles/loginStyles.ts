import { StyleSheet } from "react-native";


export const styles = StyleSheet.create({
   safeArea: {
    flex: 1,
    backgroundColor: "#FFFCF4",
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },

  logo: {
    width: 150,
    height: 106,
    marginBottom: 10,
    marginTop: 10,
  },

  title: {
    fontSize: 20,
    marginBottom: 21,
    fontFamily: 'alanSemiBold',
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
    color: "#111",
    fontFamily: 'alanRegular',
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
  paddingLeft: 45,
  textAlign: "center",
  fontSize: 16,
  fontFamily: "alanRegular",
  color: "#111",
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

errorTextBottom: {
  marginBottom: 12,
},

eyeButton: {
  height: "100%",
  width: 45,
  alignItems: "center",
  justifyContent: "center",
},

  forgotText: {
    fontSize: 12,
    color: "#111",
    marginTop: -10,
    marginBottom: 31,
    fontFamily: 'alanRegular',
  },

  linkText: {
    color: "#24A9E8",
  },

  continueButton: {
  width: 137,
  height: 40,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 33,
 },

 continueButtonDisabled: {
  backgroundColor: "#76C6FF",
  opacity: 0.65,
 },

continueButtonActive: {
  backgroundColor: "#44b1ff",
 },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: 'alanRegular',
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
    fontFamily: 'alanRegular',
  },

  socialButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFFCF4", // stesso colore dello sfondo
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  socialBorder: {
    width: "80%",
    borderRadius: 10,
    padding: 2, // <- spessore del bordo
    marginBottom: 18,
  },

  socialIcon: {
    width: 25,
    height: 25,
  },

  socialButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#0A0A0A",
    marginRight: 24,
    fontFamily: 'alanRegular',
  },

  createAccountButton: {
    width: "70%",
    height: 40,
    borderWidth: 2,
    borderColor: "#006EFF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },

  createAccountText: {
    color: "#006EFF",
    fontSize: 16,
    fontFamily: 'alanRegular',
  },

}); 