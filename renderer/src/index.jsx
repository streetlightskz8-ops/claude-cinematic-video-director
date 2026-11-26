import React from "react";
import {Composition, registerRoot, useVideoConfig, useCurrentFrame, interpolate, Audio, staticFile} from "remotion";

const Main = ({scenes = [], title = "Cinematic Video"}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, width} = useVideoConfig();
  const list = scenes.length ? scenes : [{heading:title, caption:""}];
  const perScene = Math.max(1, Math.floor(durationInFrames / list.length));
  const idx = Math.min(list.length - 1, Math.floor(frame / perScene));
  const local = frame - idx * perScene;
  const scene = list[idx];
  const fade = interpolate(local, [0, 16, Math.max(17, perScene - 16), perScene], [0, 1, 1, 0], {extrapolateLeft:"clamp", extrapolateRight:"clamp"});
  const drift = interpolate(local, [0, Math.max(1, perScene)], [34, -24]);
  const font = Math.max(34, Math.round(width * 0.075));
  return <div style={{width:"100%",height:"100%",background:"radial-gradient(circle at 70% 20%, #55422f 0%, #171719 42%, #090a0d 100%)",color:"#fff",fontFamily:"Arial, sans-serif",overflow:"hidden",position:"relative"}}>
    <div style={{position:"absolute",inset:-80,opacity:.2,background:"linear-gradient(135deg, transparent 20%, rgba(222,180,112,.25) 48%, transparent 72%)",transform:`translateX(${drift}px) rotate(-8deg)`}}/>
    {scene.image_url && <img src={scene.image_url} style={{position:"absolute",width:"100%",height:"100%",objectFit:"cover",opacity:.22}}/>}
    <div style={{position:"absolute",left:"9%",right:"9%",top:"17%",opacity:fade,transform:`translateY(${(1-fade)*35}px)`}}>
      <div style={{fontSize:Math.round(font*.32),letterSpacing:5,color:"#d8b77c",textTransform:"uppercase",marginBottom:28}}>{title}</div>
      <div style={{fontSize:font,fontWeight:700,lineHeight:1.12,textShadow:"0 8px 30px rgba(0,0,0,.4)"}}>{scene.heading}</div>
      <div style={{height:3,width:"30%",background:"#d8b77c",margin:"34px 0"}}/>
      <div style={{fontSize:Math.round(font*.42),lineHeight:1.45,color:"#e6e1d8",maxWidth:"95%"}}>{scene.caption}</div>
    </div>
    <div style={{position:"absolute",left:"9%",bottom:"8%",fontSize:18,letterSpacing:3,color:"rgba(255,255,255,.55)"}}>CINEMATIC STORY</div>
    <Audio src={staticFile("voiceover.mp3")} volume={1}/>
  </div>;
};

const Root = () => <Composition id="Main" component={Main} durationInFrames={1800} fps={30} width={1080} height={1920} defaultProps={{scenes:[],title:"Cinematic Video"}} />;
registerRoot(Root);
