import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/thiep-cuoi-110-pagedata.json', 'utf8'));

console.log('--- Inspecting Elements and Animations in 110 Pre ---');
const nodes = Object.entries(data).filter(([k]) => k !== 'ROOT');

console.log('Total element nodes:', nodes.length);

const types = new Set();
const animatedNodes = [];

nodes.forEach(([id, node]) => {
  const type = node.type?.resolvedName || node.displayName || 'Unknown';
  types.add(type);

  const props = node.props || {};
  const transition = props.transition || {};
  const effect = props.effect || {};
  const animation = props.animation || {};

  if (transition.effectEnabled || effect.effectEnabled || props.effectEnabled || props.continuousAnimation) {
    animatedNodes.push({
      id,
      type,
      props: {
        text: props.text,
        imgKey: props.imgKey,
        transition: props.transition,
        continuousAnimation: props.continuousAnimation
      }
    });
  }
});

console.log('Component types used:', [...types]);
console.log('Animated nodes count:', animatedNodes.length);
console.log('Animated nodes detail:');
console.log(JSON.stringify(animatedNodes, null, 2));
