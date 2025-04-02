import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative grid grid-rows-[auto_1fr_auto] min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">ChatFace</h1>
            </div>
            <nav className="hidden md:flex gap-6">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            </nav>
          </div>
        </header>
        
        <main className="flex flex-col items-center justify-center py-12">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                Secure messaging with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">face recognition</span>
              </h2>
              
              <p className="text-xl text-gray-300">
                ChatFace combines cutting-edge security with seamless communication. Verify your identity with a glance and chat with confidence.
              </p>
              
              <div className="flex gap-4 pt-4">
                <Link
                  href="/auth/signup"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Get Started
                </Link>
                <Link
                  href="/auth/login"
                  className="px-6 py-3 rounded-full border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 transition-all duration-300"
                >
                  Login
                </Link>
              </div>
            </div>
            
            <div className="relative">
              {/* Face recognition animation - UPDATED */}
              <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 shadow-xl">
                <div className="px-6 py-8">
                  <div className="mb-6 flex justify-center">
                    <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-full overflow-hidden border-2 border-blue-500">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Replace with your dummy face image */}
                        <Image 
                          src="/dummy-face.jpg" 
                          alt="Face Recognition" 
                          width={200} 
                          height={200} 
                          className="h-full w-full object-cover"
                        />
                        
                        {/* Scanning effects */}
                        <div className="absolute inset-0 border-4 border-blue-400/50 rounded-full animate-pulse"></div>
                        
                        {/* Face landmarks overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-3/4 h-3/4 text-blue-400/70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Eyes */}
                            <circle cx="35" cy="40" r="3" stroke="currentColor" strokeWidth="1" />
                            <circle cx="65" cy="40" r="3" stroke="currentColor" strokeWidth="1" />
                            
                            {/* Nose */}
                            <line x1="50" y1="40" x2="50" y2="55" stroke="currentColor" strokeWidth="1" />
                            
                            {/* Mouth */}
                            <path d="M35,65 Q50,75 65,65" stroke="currentColor" strokeWidth="1" fill="none" />
                            
                            {/* Face contour */}
                            <ellipse cx="50" cy="50" rx="30" ry="35" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" />
                          </svg>
                        </div>
                        
                        <div className="absolute inset-0">
                          {/* Rotating scanner */}
                          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="20" y="20" width="60" height="60" rx="30" strokeWidth="1" stroke="rgba(59, 130, 246, 0.5)" strokeDasharray="5 5" className="animate-[spin_8s_linear_infinite]" />
                            <path d="M50,20 C65,20 80,35 80,50" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="1" className="animate-[dash_2s_ease-in-out_infinite]" strokeDasharray="40 60" />
                          </svg>
                          
                          {/* Horizontal scanning line */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 animate-[scanLine_2s_ease-in-out_infinite]"></div>
                          
                          {/* Radial scan effect */}
                          <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 to-transparent rounded-full opacity-0 animate-pulse" style={{animationDuration: "3s"}}></div>
                        </div>
                        
                        {/* Processing text indicator */}
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500/30 backdrop-blur-sm py-1 text-center text-xs text-white font-mono">
                          Scanning...
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm mb-2">Face Recognition</div>
                    <h3 className="text-xl font-semibold text-white">Secure Authentication</h3>
                    <p className="text-gray-400 mt-2">Verify your identity with your unique facial features</p>
                  </div>
                </div>
              </div>
              
              {/* Chat message preview floating element */}
              <div className="absolute -bottom-5 -right-5 bg-gray-800/70 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-lg w-48 transform rotate-3 animate-float">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <div>
                    <p className="text-xs text-gray-400">Praveen</p>
                    <p className="text-sm">Hey! How&apos;s it going?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div id="features" className="mt-24 w-full">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Face Recognition</h3>
                <p className="text-gray-400">Secure authentication using advanced facial recognition technology</p>
              </div>
              
              <div className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-time Messaging</h3>
                <p className="text-gray-400">Instantaneous message delivery with read receipts and typing indicators</p>
              </div>
              
              <div className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-teal-500/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center mb-4 group-hover:bg-teal-500/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Speech-to-Text</h3>
                <p className="text-gray-400">Effortlessly convert your voice messages into text with high accuracy</p>
              </div>
              
              <div className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 hover:border-amber-500/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Private Rooms</h3>
                <p className="text-gray-400">Create and manage secure chat rooms for private conversations</p>
              </div>
            </div>
          </div>
        </main>
        
        <footer className="py-8 text-center border-t border-gray-800 mt-24">
          <p className="text-gray-400">ChatFace - Secure messaging with face recognition</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
