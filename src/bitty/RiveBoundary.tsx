import { Component, type ReactNode } from 'react';
/** A failed dynamic chunk or canvas runtime must keep the SVG fallback usable. */
export default class RiveBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  componentDidCatch(){this.props.onFailure();}
  render(){return this.state.failed?null:this.props.children;}
}
