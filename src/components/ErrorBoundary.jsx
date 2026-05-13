import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('App Error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-[#141E30] text-white gap-4 p-8">
                    <div className="text-5xl">⚠️</div>
                    <h1 className="text-xl font-black">Terjadi Kesalahan</h1>
                    <p className="text-slate-400 text-sm text-center max-w-md">
                        {this.state.error?.message || 'Unknown error'}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-bold"
                    >
                        Coba Lagi
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
