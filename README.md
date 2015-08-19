jsh
===

To preface, I don't really know much about shells. I'm trying to learn as I go. As a Windows user, this may just be a naive or misguided project, but nevertheless, it's kinda fun.

My initial motivation for `jsh` and the [`webterm`](https://github.com/a-type/webterm) project was a simple dissatisfaction with the aesthetics of Windows consoles. `webterm` is attempting to address that, as well as explore different ways to interact with a terminal. `jsh` is just trying to enable that.

Ideally, I would use something like [`pty.js`](https://github.com/chjj/pty.js/), but it simply doesn't seem to work anymore, and Windows is not a high-priority platform for such a project. Not to mention Windows is obviously very different from Unix environments, and any interoperability is fragile.

I'm more of a high-level developer, with a love of front-end and a hearty tolerance of JavaScript, so why not at least take a stab at bringing that sort of abstraction to the shell? It may not be performant, or strictly standards-compliant, but it might work. Jury's still out on that.

`jsh` is still in early development and is likely to change dramatically. I might not even end up needing it. I wouldn't try to use it yet. Its features and design will be heavily motivated by the way `webterm` works.
