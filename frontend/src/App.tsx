import { Routes, Route } from 'react-router-dom';
import { Upload, FilePlus2, Search, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FeatureCard } from './components/FeatureCard';
import { Footer } from './components/Footer';
import { UploadCV } from './pages/UploadCV';
import { JobAnalysis } from './pages/JobAnalysis';
import { CVBuilder } from './pages/CVBuilder';
import { TipsPage } from './pages/TipsPage';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-purple-100 selection:text-purple-700">
      <Header />
      <main>
        <Hero />
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
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
              onClick={() => navigate('/upload')}
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
              onClick={() => navigate('/build')}
            />
            <FeatureCard
              title="Analyse Job"
              description="Paste a job description to extract key skills and check how well your CV matches the role."
              icon={Search}
              variant="purple"
              buttonText="Analyse Job"
              features={[
                "Keyword Extraction",
                "ATS Match Score",
                "Missing Keywords",
                "Tailored Recommendations"
              ]}
              onClick={() => navigate('/job-analysis')}
            />
            <FeatureCard
              title="Tips & Guidance"
              description="CV writing advice, interview tips, STAR method guide, and how to beat ATS systems."
              icon={Lightbulb}
              variant="teal"
              buttonText="View Tips"
              features={[
                "CV Writing Tips",
                "ATS Advice",
                "STAR Method Guide",
                "Interview Preparation"
              ]}
              onClick={() => navigate('/tips')}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/upload" element={<UploadCV />} />
       <Route path="/job-analysis" element={<JobAnalysis />} />
       <Route path="/build" element={<CVBuilder />} />
        <Route path="/tips" element={<TipsPage />} />
    </Routes>
  );
}

export default App;