import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="background bg-background mx-10 mt-9 relative min-h-screen">
      <Navbar/>
      <div className="hero h-screen flex flex-col gap-8 items-center justify-center">
        <Image src='mesh.svg' width={200} height={200} alt="grad" className="absolute -right-10 z-20"/>
        <Image src='mesh.svg' style={{transform: 'rotate(180deg)'}} width={200} height={200} alt="grad" className="absolute -left-10 z-20"/>
        <div className="title -mt-10 text-[4rem] font-zt-formom relative">
          <h1 className="z-100">Optimize Your Workflow</h1>
          <div className="absolute top-0 left-[calc(50%-45vw)] w-[90vw] h-px bg-gray-300"></div>
          <div className="absolute bottom-2 left-[calc(50%-45vw)] w-[90vw] h-px bg-gray-300"></div>
          <div className="line absolute left-0 top-[calc(50%-49vh)] w-px h-screen bg-gray-300"></div>
          <div className="line absolute right-0 top-[calc(50%-49vh)] w-px h-screen bg-gray-300"></div>
        </div>
        <div className="upper-box  bg-white flex flex-col justify-center items-center gap-6 relative w-[45rem]">
          <div className="box z-100 font-inter font-medium  bg-white drop-shadow-xl rounded-3xl p-5 w-full flex flex-col justify-end">
            <textarea className="h-20 resize-none placeholder:text-gray-300 focus:outline-none " placeholder="Send an email to bobby@example.com that we're going to have a meeting tomorrow at 9AM.&#10;Schedule the meeting too, add him as an attendee." />
            <div className="icons flex justify-between items-center mt-6">
              <div className="google flex gap-4">
                <Image alt="gmail" width={30} height={30} src='https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg' className="hover:scale-110 hover:-translate-y-1 transform transition-all duration-200 cursor-pointer"/>
                <Image alt="calendar" width={30} height={30} src='https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' className="hover:scale-110 hover:-translate-y-1 transform transition-all duration-200 cursor-pointer"/>

              </div>
              <a href="/log-in" className="bg-primary w-14 h-10 flex items-center justify-center rounded-md hover:bg-[#A0B71F] transition-colors duration-200 group">
                <Image alt="arrow" width={30} height={30} src='/Arrow_Right_LG.svg' className="group-hover:translate-x-1 transition-transform duration-200"/>
              </a>
            </div>
          </div>
          <div className="absolute top-0 left-[calc(50%-45vw)] w-[90vw] h-px bg-gray-300"></div>
          <div className="absolute bottom-0 left-[calc(50%-45vw)] w-[90vw] h-px bg-gray-300"></div>
          <div className="line absolute left-0 top-[calc(-60vh)] w-px h-[100vh] bg-gray-300"></div>
          <div className="line absolute right-0 top-[calc(-60vh)] w-px h-[100vh] bg-gray-300"></div>
        </div>
      </div>
      <div className="features text-center relative">
        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-background to-transparent pointer-events-none"></div>
        <h1 className="font-zt-formom text-5xl relative z-10">An AI agent built to ease your work.</h1>
        <div className="video mt-5 flex justify-center">
          <div className="w-full max-w-4xl p-4 rounded-2xl">
            <video
              className="w-full h-fit rounded-2xl shadow-lg bg-gray-100 mt-4"
              muted
              autoPlay
              preload="metadata"
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
