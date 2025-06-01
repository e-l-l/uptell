import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Activity,
  Bell,
  BarChart3,
  Users,
  Zap,
  CheckCircle,
  Clock,
  Globe,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">uptell</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              Real-time Status Monitoring
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Keep Your Users
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {" "}
                Informed
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Professional status pages and incident management for modern
              teams. Monitor applications, manage incidents, and keep your users
              updated in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to manage uptime
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From incident response to status communication, we've got you
              covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-good-bg dark:bg-good-bg-dark rounded-lg flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-good-fg dark:text-good-fg-dark" />
                </div>
                <CardTitle>Real-time Monitoring</CardTitle>
                <CardDescription>
                  Monitor all your applications and services with live status
                  updates and instant notifications.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-worse-bg dark:bg-worse-bg-dark rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-worse-fg dark:text-worse-fg-dark" />
                </div>
                <CardTitle>Incident Management</CardTitle>
                <CardDescription>
                  Complete incident lifecycle management from detection to
                  resolution with detailed tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-bad-bg dark:bg-bad-bg-dark rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-bad-fg dark:text-bad-fg-dark" />
                </div>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Track uptime metrics, analyze trends, and get insights into
                  your service reliability.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-unknown-bg dark:bg-unknown-bg-dark rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-unknown-fg dark:text-unknown-fg-dark" />
                </div>
                <CardTitle>Multi-tenant Organizations</CardTitle>
                <CardDescription>
                  Manage multiple organizations and teams with role-based access
                  control.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-worst-bg dark:bg-worst-bg-dark rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-worst-fg" />
                </div>
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  WebSocket-powered live updates keep all stakeholders informed
                  instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Maintenance Scheduling</CardTitle>
                <CardDescription>
                  Plan and communicate scheduled maintenance windows to minimize
                  surprises.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Status Types Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Clear status communication
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Keep everyone informed with clear, color-coded status indicators
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Operational</CardTitle>
                <CardDescription>All systems running smoothly</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Degraded</CardTitle>
                <CardDescription>Performance issues detected</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Partial Outage</CardTitle>
                <CardDescription>Some services affected</CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Unknown</CardTitle>
                <CardDescription>Status being investigated</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to improve your uptime communication?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join teams who trust uptell to keep their users informed and their
              services running smoothly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              {/* <Link href="/contact"> */}
                <Button
                  variant="outline"
                  size="lg"
                className="w-full sm:w-auto"
                disabled
                >
                  Contact Sales
                </Button>
              {/* </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">uptell</span>
            </div>
            {/* <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/docs"
                className="hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/support"
                className="hover:text-foreground transition-colors"
              >
                Support
              </Link>
            </div> */}
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            © 2025 uptell. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
