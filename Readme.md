# Jade-PHP

Adds the possibility of compiling PHP for Jade

## Usage

	var jade = require('jade');
	var jadephp = require('jade-php');

	jadephp(jade);

    var html = jade.render('string of jade');

## Example

The following code:

    !!!
    html
        head
            title= $title

        body
            ul
                - foreach ($this->list as $list):
                    li!= $list
                - endforeach

Will produce:

    <!DOCTYPE html>
    <html>
        <head>
            <title><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></title>
        </head>

        <body>
            <ul>
                <?php foreach ($this->list as $list): ?>
                    <li><?php echo $list; ?></li>
                <?php endforeach; ?>
            </ul>
        </body>
    </html>
