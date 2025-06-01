"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { connectWebSocket } from "@/lib/socket";

interface DebugTest {
  name: string;
  status: "pending" | "running" | "success" | "error";
  result?: string;
  details?: string;
}

export default function DebugPage() {
  const currentOrg = useAtomValue(currentOrgAtom);
  const [tests, setTests] = useState<DebugTest[]>([
    { name: "Backend HTTP API", status: "pending" },
    { name: "Backend WebSocket", status: "pending" },
    { name: "WebSocket Connection", status: "pending" },
  ]);

  const updateTest = (name: string, updates: Partial<DebugTest>) => {
    setTests((prev) =>
      prev.map((test) => (test.name === name ? { ...test, ...updates } : test))
    );
  };

  const runHttpTest = async () => {
    updateTest("Backend HTTP API", { status: "running" });

    try {
      const HTTP_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${HTTP_BASE}/docs`, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        updateTest("Backend HTTP API", {
          status: "success",
          result: `✅ Connected (${response.status})`,
          details: `Backend API is accessible at ${HTTP_BASE}`,
        });
      } else {
        updateTest("Backend HTTP API", {
          status: "error",
          result: `❌ HTTP ${response.status}`,
          details: "Backend returned an error status",
        });
      }
    } catch (error) {
      updateTest("Backend HTTP API", {
        status: "error",
        result: "❌ Connection failed",
        details: `Cannot reach backend: ${error}`,
      });
    }
  };

  const runWebSocketTest = async () => {
    updateTest("Backend WebSocket", { status: "running" });

    try {
      const WS_BASE =
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
      const testSocket = new WebSocket(WS_BASE);

      const timeout = setTimeout(() => {
        testSocket.close();
        updateTest("Backend WebSocket", {
          status: "error",
          result: "❌ Connection timeout",
          details: "WebSocket connection timed out after 5 seconds",
        });
      }, 5000);

      testSocket.onopen = () => {
        clearTimeout(timeout);
        testSocket.close();
        updateTest("Backend WebSocket", {
          status: "success",
          result: "✅ WebSocket accessible",
          details: `WebSocket endpoint is working at ${WS_BASE}`,
        });
      };

      testSocket.onerror = (error) => {
        clearTimeout(timeout);
        updateTest("Backend WebSocket", {
          status: "error",
          result: "❌ WebSocket error",
          details: `WebSocket connection failed: ${error}`,
        });
      };

      testSocket.onclose = (event) => {
        if (event.code !== 1000) {
          clearTimeout(timeout);
          updateTest("Backend WebSocket", {
            status: "error",
            result: `❌ Closed (${event.code})`,
            details: `WebSocket closed unexpectedly: ${
              event.reason || "No reason provided"
            }`,
          });
        }
      };
    } catch (error) {
      updateTest("Backend WebSocket", {
        status: "error",
        result: "❌ Failed to create",
        details: `Failed to create WebSocket: ${error}`,
      });
    }
  };

  const runWebSocketConnectionTest = () => {
    if (!currentOrg?.id) {
      updateTest("WebSocket Connection", {
        status: "error",
        result: "❌ No org_id",
        details: "Cannot test WebSocket connection without organization ID",
      });
      return;
    }

    updateTest("WebSocket Connection", { status: "running" });

    const cleanup = connectWebSocket(currentOrg.id, (message) => {
      updateTest("WebSocket Connection", {
        status: "success",
        result: "✅ Connection works",
        details: `Connected and ready to receive messages for org: ${currentOrg.id}`,
      });
      // Clean up after successful test
      setTimeout(() => cleanup(), 1000);
    });

    // Set a timeout to detect if connection fails
    setTimeout(() => {
      const currentTest = tests.find((t) => t.name === "WebSocket Connection");
      if (currentTest?.status === "running") {
        updateTest("WebSocket Connection", {
          status: "error",
          result: "❌ Connection failed",
          details:
            "WebSocket connection test failed - check console for details",
        });
        cleanup();
      }
    }, 10000);
  };

  const runAllTests = async () => {
    // Reset all tests
    setTests((prev) =>
      prev.map((test) => ({ ...test, status: "pending" as const }))
    );

    // Run tests sequentially
    await runHttpTest();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await runWebSocketTest();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    runWebSocketConnectionTest();
  };

  const getStatusBadge = (status: DebugTest["status"]) => {
    const variants = {
      pending: "outline",
      running: "default",
      success: "default",
      error: "destructive",
    } as const;

    const colors = {
      pending: "bg-gray-500",
      running: "bg-blue-500",
      success: "bg-green-500",
      error: "bg-red-500",
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status === "running" && "🔄 "}
        {status === "success" && "✅ "}
        {status === "error" && "❌ "}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const envVars = {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws",
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WebSocket Debug Center</h1>
        <p className="text-muted-foreground">
          Diagnose WebSocket and backend connectivity issues
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>Current environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {key}
                </code>
                <span className="text-sm">{value}</span>
              </div>
            ))}
          </div>
          {currentOrg && (
            <>
              <Separator className="my-4" />
              <div className="flex justify-between items-center">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  Current Org ID
                </code>
                <span className="text-sm font-mono">{currentOrg.id}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connectivity Tests</CardTitle>
          <CardDescription>
            Test backend and WebSocket connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAllTests} className="w-full">
            Run All Tests
          </Button>

          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{test.name}</span>
                  {getStatusBadge(test.status)}
                </div>
                {test.result && (
                  <div className="text-sm text-muted-foreground">
                    {test.result}
                  </div>
                )}
                {test.details && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {test.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>If Backend HTTP API fails:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Check if the backend server is running</li>
              <li>
                Verify the backend is running on the correct port (default:
                8000)
              </li>
              <li>Check the NEXT_PUBLIC_API_URL environment variable</li>
            </ul>
          </div>

          <div>
            <strong>If Backend WebSocket fails:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Ensure the backend supports WebSocket connections</li>
              <li>Check if the /ws endpoint is properly configured</li>
              <li>Verify the NEXT_PUBLIC_WS_URL environment variable</li>
            </ul>
          </div>

          <div>
            <strong>If WebSocket Connection fails:</strong>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Check browser console for detailed error messages</li>
              <li>Ensure you're logged in with a valid organization</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
