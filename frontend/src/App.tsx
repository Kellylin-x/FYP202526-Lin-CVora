import { Upload, FilePlus2 } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeatureCard } from './components/FeatureCard';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-purple-100 selection:text-purple-700">
      <Header />

      <main>
        <Hero />

        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">

            <FeatureCard
              title="Enhance Existing CV"
              description="Upload your current CV and let our AI enhance it with powerful suggestions and improvements."
              icon={Upload}
              variant="teal"
              buttonText="Upload CV"
              features={[
                "Upload PDF or DOCX",
                "AI Enhancement",
                "ATS Compatibility Check",
                "Job Tailoring"
              ]}
              onClick={() => console.log('Upload clicked')}
            />

            <FeatureCard
              title="Build New CV"
              description="Create a professional CV from scratch with our step-by-step wizard and AI guidance."
              icon={FilePlus2}
              variant="purple"
              buttonText="Start Building"
              features={[
                "Step-by-step Wizard",
                "Real-time Suggestions",
                "Live Preview",
                "STAR Method Guidance"
              ]}
              onClick={() => console.log('Build clicked')}
            />

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
