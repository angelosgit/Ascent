import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

export default function SceneVideo({ running }) {
  const player = useVideoPlayer(
    require("../../assets/video/FINAL_LOOP.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
    },
  );

  useEffect(() => {
    if (running) {
      player.play();
    } else {
      player.pause();
    }
  }, [running, player]);

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="cover"
        // Without this Safari hands the clip to the fullscreen native player
        // the moment it starts, taking over the screen.
        playsInline
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F6A84B",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});

