"use client";

import { useState } from "react";

import { toast } from "sonner";

import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";

import CoverLetterPreview from "./cover-letter-preview";

import { updateCoverLetter } from "@/actions/cover-letter";

const EditCoverLetterClient = ({
  initialContent,
  coverLetterId,
}) => {
  const [content, setContent] = useState(initialContent);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateCoverLetter(coverLetterId, content);

      toast.success("Cover letter updated!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />

          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <CoverLetterPreview
        content={content}
        setContent={setContent}
      />
    </div>
  );
};

export default EditCoverLetterClient;