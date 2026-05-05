export const useUserProfile = () => {
  const defaultAvatar = "https://avatars.githubusercontent.com/u/183593474?v=4";
  const defaultName = "António Amorim";

  const profile = useState("user-profile", () => ({
    name: defaultName,
    avatar: defaultAvatar,
  }));

  if (!profile.value || typeof profile.value !== "object") {
    profile.value = {
      name: defaultName,
      avatar: defaultAvatar,
    };
  }

  profile.value.name ||= defaultName;
  profile.value.avatar ||= defaultAvatar;

  return {
    profile,
    defaultName,
    defaultAvatar,
  };
};
