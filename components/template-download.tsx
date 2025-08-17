'use client';

import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

export function TemplateDownload() {
  const handleDownload = () => {
    // Open the HTML template in a new tab for the user to download as Excel
    window.open('/templates/od_template.html', '_blank');
  };

  return (
    <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-start">
        <div className="p-2 bg-blue-900/30 rounded-lg mr-4">
          <FileText className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Need a Template?</h3>
          <p className="text-slate-300 mb-4">
            Use our interactive template to create your OD request. Fill in the details and export to Excel when ready.
          </p>
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Open OD Request Template
          </Button>
          <p className="text-xs text-slate-400 mt-2">
            The template will open in a new tab. Fill in the details and click "Export to Excel" when done.
          </p>
        </div>
      </div>
    </div>
  );
}
