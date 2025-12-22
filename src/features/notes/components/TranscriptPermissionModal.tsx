import { AlertCircle, Download } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface TranscriptPermissionModalProps {
  isOpen: boolean;
  videoId: string;
  onImport: () => void;
  onCancel: () => void;
  isImporting?: boolean;
}

export function TranscriptPermissionModal({
  isOpen,
  videoId,
  onImport,
  onCancel,
  isImporting = false,
}: TranscriptPermissionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle className="text-xl">One-time permission needed</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed pt-2">
            We need to import captions from YouTube once using your browser.
            After this, notes for this video will always be instant.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
          <p className="text-sm text-blue-900">
            <strong>Video ID:</strong> {videoId}
          </p>
          <p className="text-xs text-blue-700 mt-2">
            This uses your browser's YouTube session to fetch captions directly.
            No credentials are stored.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isImporting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onImport}
            disabled={isImporting}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {isImporting ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-pulse" />
                Importing captions...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Import captions now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
