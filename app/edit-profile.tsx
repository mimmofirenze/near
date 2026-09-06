import {
  Pressable,
  Text,
  TextInput,
  View,
  Image,
  ScrollView,
} from "react-native";

import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";

import {
  getCurrentProfile,
  updateCurrentProfile,
  pickAndUploadAvatar,
  getVisitedCountries,
  addVisitedCountry,
  removeVisitedCountry,
} from "../utils/profile";

import { useAppTheme } from "../contexts/themeContext";

import { Ionicons } from "@expo/vector-icons";

function countryCodeToFlag(countryCode: string) {
  if (countryCode.length !== 2) {
    return "🌍";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map((letter) =>
      String.fromCodePoint(letter.charCodeAt(0) + 127397)
    )
    .join("");
}

export default function EditProfileScreen() {

  const { theme, colorScheme } =
  useAppTheme();

  const defaultAvatar =
  colorScheme === "dark"
    ? require("../assets/images/Sample_User_Icon-dark.png")
    : require("../assets/images/Sample_User_Icon.png");

  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [countryCode, setCountryCode] =
    useState<CountryCode | undefined>(undefined);

  const [countryName, setCountryName] = useState("");
  const [countryPickerVisible, setCountryPickerVisible] =
    useState(false);

  const [visitedCountries, setVisitedCountries] = useState<CountryCode[]>([]);
  const [
    visitedCountryPickerVisible,
    setVisitedCountryPickerVisible,
  ] = useState(false);

  const [updatingVisitedCountries, setUpdatingVisitedCountries] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const [
        { profile, error: profileError },
        { countries, error: countriesError },
      ] = await Promise.all([
        getCurrentProfile(),
        getVisitedCountries(),
      ]);

      if (profileError) {
        setErrorMessage(profileError.message);
        setLoading(false);
        return;
      }

      setFirstName(profile?.first_name ?? "");
      setUsername(profile?.username ?? "");
      setBio(profile?.bio ?? "");
      setAvatarUrl(profile?.avatar_url ?? null);

      if (profile?.country_code) {
        setCountryCode(
          profile.country_code.toUpperCase() as CountryCode
        );
      }

      if (countriesError) {
        setErrorMessage(countriesError.message);
      } else {
        setVisitedCountries(
          countries.map(
            (visitedCountry) =>
              visitedCountry.toUpperCase() as CountryCode
          )
        );
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleCountrySelect = (country: Country) => {
    setCountryCode(country.cca2);

    const selectedCountryName =
      typeof country.name === "string"
        ? country.name
        : country.name.common;

    setCountryName(selectedCountryName);
    setCountryPickerVisible(false);
    setErrorMessage("");
  };

  const handleVisitedCountrySelect = async (
    country: Country
  ) => {
    const selectedCode = country.cca2;

    setVisitedCountryPickerVisible(false);
    setErrorMessage("");

    if (visitedCountries.includes(selectedCode)) {
      return;
    }

    try {
      setUpdatingVisitedCountries(true);

      const { error } = await addVisitedCountry(
        selectedCode
      );

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setVisitedCountries((currentCountries) => [
        ...currentCountries,
        selectedCode,
      ]);
    } catch {
      setErrorMessage("Could not add the country.");
    } finally {
      setUpdatingVisitedCountries(false);
    }
  };

  const handleRemoveVisitedCountry = async (
    visitedCountryCode: CountryCode
  ) => {
    try {
      setUpdatingVisitedCountries(true);
      setErrorMessage("");

      const { error } = await removeVisitedCountry(
        visitedCountryCode
      );

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setVisitedCountries((currentCountries) =>
        currentCountries.filter(
          (code) => code !== visitedCountryCode
        )
      );
    } catch {
      setErrorMessage("Could not remove the country.");
    } finally {
      setUpdatingVisitedCountries(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      setErrorMessage("First name is required.");
      return;
    }

    if (!countryCode) {
      setErrorMessage("Please select your country.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const { error } = await updateCurrentProfile({
        first_name: firstName,
        username,
        bio,
        country_code: countryCode,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.back();
    } catch {
      setErrorMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPress = async () => {
    try {
      setUploadingAvatar(true);
      setErrorMessage("");

      const { avatarUrl, error, canceled } =
        await pickAndUploadAvatar();

      if (canceled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setAvatarUrl(avatarUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: theme.text }}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 50,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 16 }}>
          <View
            style={{
              position: "relative",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              minHeight: 40,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={{
                position: "absolute",
                left: 0,
                top: 2,
                width: 36,
                height: 36,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 2,
              }}
            >
              <Ionicons
                name="arrow-back-outline"
                size={30}
                color={theme.text}
              />
            </Pressable>

            <Text
              style={{
                color: theme.text,
                fontSize: 28,
                textAlign: "center",
                fontFamily: "alanRegular",
              }}
            >
              Edit profile
            </Text>
          </View>

          <Pressable
            onPress={handleAvatarPress}
            disabled={uploadingAvatar}
          >
            <Image
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : defaultAvatar
              }
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                alignSelf: "center",
              }}
            />

            <Text
              style={{
                color: theme.text,
                textAlign: "center",
                marginTop: 10,
                marginBottom: 20,
                fontFamily: "alanRegular",
              }}
            >
              {uploadingAvatar
                ? "Uploading..."
                : "Change profile picture"}
            </Text>
          </Pressable>

          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor="#888"
            style={{
              borderWidth: 1,
              borderColor: theme.text,
              color: theme.text,
              padding: 14,
              borderRadius: 12,
              fontFamily: "alanRegular",
            }}
          />

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#888"
            style={{
              borderWidth: 1,
              borderColor: theme.text,
              color: theme.text,
              padding: 14,
              borderRadius: 12,
              fontFamily: "alanRegular",
            }}
          />

          <Pressable
            onPress={() =>
              setCountryPickerVisible(true)
            }
            style={{
              borderWidth: 1,
              borderColor: theme.text,
              padding: 14,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: countryCode
                  ? theme.text
                  : "#888",
                fontFamily: "alanRegular",
              }}
            >
              {countryCode
                ? `${countryCodeToFlag(countryCode)} ${
                    countryName || countryCode
                  }`
                : "Select your country"}
            </Text>
          </Pressable>

          <CountryPicker
            countryCode={countryCode ?? "IT"}
            visible={countryPickerVisible}
            onSelect={handleCountrySelect}
            onClose={() =>
              setCountryPickerVisible(false)
            }
            withFilter
            withFlag
            withEmoji
            withCountryNameButton={false}
            withCallingCode={false}
            withAlphaFilter
            translation="common"
          />

          <View style={{ gap: 10 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: 16,
                fontFamily: "alanRegular",
              }}
            >
              Countries visited
            </Text>

            <Pressable
              onPress={() =>
                setVisitedCountryPickerVisible(true)
              }
              disabled={updatingVisitedCountries}
              style={{
                borderWidth: 1,
                borderColor: theme.text,
                padding: 14,
                borderRadius: 12,
                opacity: updatingVisitedCountries
                  ? 0.6
                  : 1,
              }}
            >
              <Text
                style={{
                  color: theme.text,
                  fontFamily: "alanRegular",
                }}
              >
                {updatingVisitedCountries
                  ? "Updating..."
                  : "Add visited country"}
              </Text>
            </Pressable>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {visitedCountries.map(
                (visitedCountryCode) => (
                  <Pressable
                    key={visitedCountryCode}
                    onPress={() =>
                      handleRemoveVisitedCountry(
                        visitedCountryCode
                      )
                    }
                    disabled={
                      updatingVisitedCountries
                    }
                    style={{
                      borderWidth: 1,
                      borderColor: theme.text,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.text,
                        fontFamily: "alanRegular",
                      }}
                    >
                      {countryCodeToFlag(
                        visitedCountryCode
                      )}{" "}
                      {visitedCountryCode} ×
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          </View>

          <CountryPicker
            countryCode="IT"
            visible={visitedCountryPickerVisible}
            onSelect={handleVisitedCountrySelect}
            onClose={() =>
              setVisitedCountryPickerVisible(false)
            }
            withFilter
            withFlag
            withEmoji
            withCountryNameButton={false}
            withCallingCode={false}
            withAlphaFilter
            translation="common"
          />

          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Bio"
            multiline
            placeholderTextColor="#888"
            style={{
              borderWidth: 1,
              borderColor: theme.text,
              color: theme.text,
              padding: 14,
              borderRadius: 12,
              minHeight: 100,
              textAlignVertical: "top",
              fontFamily: "alanRegular",
            }}
          />

          {errorMessage ? (
            <Text style={{ color: "red" }}>
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: theme.text,
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                color: theme.background,
                fontFamily: "alanRegular",
              }}
            >
              {saving
                ? "Saving..."
                : "Save changes"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}