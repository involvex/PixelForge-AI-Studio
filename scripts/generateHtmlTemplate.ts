/**
 * This script generates a proper Vite-compatible HTML template
 * that will work with the development server and production builds
 */

const generateHtmlTemplate = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PixelForge AI Studio</title>
    <meta name="description" content="PixelForge AI Studio - Pixel Art Editor with AI Assistance" />

    <!-- Tailwind CSS CDN with custom configuration -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ["Inter", "sans-serif"],
              pixel: ['"Press Start 2P"', "cursive"],
            },
            colors: {
              gray: {
                750: "#2d3748",
                850: "#1a202c",
                950: "#0d1117",
              },
            },
          },
        },
      };
    </script>

    <!-- Google Fonts -->
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Press+Start+2P&display=swap"
      rel="stylesheet"
    />

    <!-- Custom CSS for pixel art interface -->
    <style>
      /* Custom scrollbar for dark theme */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #1a202c;
      }
      ::-webkit-scrollbar-thumb {
        background: #4a5568;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #718096;
      }

      /* Checkerboard pattern for transparent backgrounds */
      .checkerboard {
        background-image:
          linear-gradient(45deg, #2d3748 25%, transparent 25%),
          linear-gradient(-45deg, #2d3748 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #2d3748 75%),
          linear-gradient(-45deg, transparent 75%, #2d3748 75%);
        background-size: 20px 20px;
        background-position:
          0 0,
          0 10px,
          10px -10px,
          -10px 0px;
      }

      /* Marching ants for selection areas */
      .selection-ants {
        background-size:
          10px 2px,
          10px 2px,
          2px 10px,
          2px 10px;
        background-position:
          0 0,
          0 100%,
          0 0,
          100% 0;
        background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
        animation: ants 1s linear infinite;
        background-image:
          linear-gradient(to right, #fff 50%, transparent 50%),
          linear-gradient(to right, #fff 50%, transparent 50%),
          linear-gradient(to bottom, #fff 50%, transparent 50%),
          linear-gradient(to bottom, #fff 50%, transparent 50%);
      }

      @keyframes ants {
        0% {
          background-position:
            0 0,
            0 100%,
            0 0,
            100% 0;
        }
        100% {
          background-position:
            20px 0,
            -20px 100%,
            0 -20px,
            100% 20px;
        }
      }

      /* Loading animation for fallback */
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      /* Fallback loading styles */
      .loading-fallback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #0d1117;
        color: white;
        padding: 1rem;
        font-family: sans-serif;
      }

      .loading-spinner {
        width: 6rem;
        height: 6rem;
        margin: 0 auto 1.5rem;
        position: relative;
      }

      .loading-text {
        text-align: center;
        color: #9ca3af;
        margin-bottom: 1.5rem;
      }

      .error-message {
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 0.5rem;
        padding: 1.5rem;
        max-width: 32rem;
        text-align: center;
        margin: 1rem 0;
      }

      .retry-button {
        background: #4f46e5;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-weight: 500;
        transition: background-color 0.2s;
        cursor: pointer;
      }

      .retry-button:hover {
        background: #4338ca;
      }
    </style>
  </head>
  <body class="bg-gray-950 text-white overflow-hidden">
    <!-- Root element for React application -->
    <div id="root"></div>

    <!-- Fallback loading indicator that will be replaced by React -->
    <script>
      // Initial loading state
      window.ReactAppLoaded = false;

      // Fallback loading indicator
      document.addEventListener('DOMContentLoaded', function() {
        const root = document.getElementById('root');
        if (root && root.innerHTML.trim() === '') {
          root.innerHTML = \`
            <div class="loading-fallback">
              <div class="loading-spinner">
                <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                  <title>Loading PixelForge AI Studio</title>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" stroke-width="8"
                    stroke-dasharray="283" stroke-dashoffset="233" stroke-linecap="round"
                    transform="rotate(-90 50 50)">
                    <animate attributeName="stroke-dashoffset" from="283" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <text x="50" y="55" text-anchor="middle" fill="#3b82f6" font-size="14" font-weight="bold">Loading...</text>
                </svg>
              </div>
              <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">PixelForge AI Studio</h1>
              <p class="loading-text">Preparing pixel art workspace...</p>
              <div style="color: #6b7280; font-size: 0.875rem; line-height: 1.25;">
                <p>Loading application components</p>
                <p>Initializing AI modules</p>
                <p>Setting up canvas tools</p>
              </div>
            </div>
          \`;

          // Set timeout for error handling
          setTimeout(() => {
            if (!window.ReactAppLoaded) {
              root.innerHTML = \`
                <div class="loading-fallback">
                  <div class="error-message">
                    <h2 style="font-size: 1.25rem; font-weight: bold; color: #ef4444; margin-bottom: 1rem;">
                      Loading Failed
                    </h2>
                    <p style="color: #f3f4f6; margin-bottom: 1rem;">
                      The application failed to load. This could be due to network issues or browser compatibility problems.
                    </p>
                    <button class="retry-button" onclick="window.location.reload()">
                      Retry Loading
                    </button>
                  </div>
                </div>
              \`;
            }
          }, 15000);
        }
      });
    </script>
  </body>
</html>`;
};

// Export for potential programmatic use
export { generateHtmlTemplate };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("node:fs").then(fs => {
    import("node:path").then(path => {
      try {
        const template = generateHtmlTemplate();
        const outputPath = path.default.join(
          __dirname,
          "..",
          "public",
          "index.html",
        );
        fs.default.writeFileSync(outputPath, template, "utf8");
        console.log("✅ HTML template generated successfully");
      } catch (error) {
        console.error("❌ Error generating HTML template:", error);
        process.exit(1);
      }
    });
  });
}
