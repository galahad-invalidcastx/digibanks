// Add at the beginning of Post component:
const mountedRef = useRef(true);

useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
  };
}, []);

// In the profile loading useEffect:
useEffect(() => {
  const loadProfile = async () => {
    if (!mountedRef.current) return;
    const profileData = await fetchProfile(post.pubkey);
    if (mountedRef.current) {
      setProfile(profileData);
      setLoadingProfile(false);
    }
  };
  loadProfile();
}, [post.pubkey]);