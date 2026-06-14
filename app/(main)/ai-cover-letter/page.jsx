import CoverLetterGenerator from "./_components/cover-letter-generator";

const AICoverLetterPage = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-2 mb-6">
        <h1 className="text-6xl font-bold gradient-title">AI Cover Letter</h1>
        <p className="text-muted-foreground">
          Generate a tailored cover letter from your profile and the job description.
        </p>
      </div>

      <CoverLetterGenerator />
    </div>
  );
};

export default AICoverLetterPage;